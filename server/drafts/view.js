const express = require('express')
const { supabase } = require('../../lib/server/supabase.cjs')
const crypto = require('crypto')

const router = express.Router()

const gateStore = {}
function rateLimit(ip, limit = 20, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  const entry = gateStore[ip]
  if (!entry || now > entry.resetAt) {
    gateStore[ip] = { count: 1, resetAt: now + windowMs }
    return true
  }
  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

router.get('/view', async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].toString().split(',')[0]) || req.socket.remoteAddress || 'unknown'
    if (!rateLimit(ip)) return res.status(429).json({ success: false, error: 'Rate limit exceeded' })
    const sessionId = String(req.query.sessionId || '')
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' })
    const cookieHeader = req.headers['cookie'] || ''
    const paidCookie = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('paid_session='))
      ?.split('=')[1]
    if (paidCookie) {
      try {
        const decoded = Buffer.from(paidCookie, 'base64').toString('utf8')
        const [sid, sig] = decoded.split('.')
        const secret = process.env.COOKIE_SECRET || 'scidraft-secret'
        const expected = crypto.createHmac('sha256', secret).update(sid).digest('hex')
        if (sid === sessionId && sig === expected) {
          const { data: draft, error: draftErr } = await supabase
            .from('drafts')
            .select('id, session_id, user_id, draft, status, created_at, updated_at')
            .eq('session_id', sessionId)
            .maybeSingle()
          if (draftErr) return res.status(500).json({ success: false, error: draftErr.message })
          if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' })
          return res.status(200).json({ success: true, data: draft })
        }
      } catch (_) {}
    }
    const { data: draft, error: draftErr } = await supabase
      .from('drafts')
      .select('id, session_id, user_id, draft, status, created_at, updated_at')
      .eq('session_id', sessionId)
      .maybeSingle()
    if (draftErr) return res.status(500).json({ success: false, error: draftErr.message })
    if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' })
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('status, transaction_id, created_at')
      .ilike('transaction_id', `%${sessionId}%`)
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (payErr) return res.status(500).json({ success: false, error: payErr.message })
    if (!payment || payment.status !== 'success') {
      return res.status(403).json({ success: false, error: 'Payment required' })
    }
    return res.status(200).json({ success: true, data: draft })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err && err.message) || 'Server error' })
  }
})

module.exports = router

