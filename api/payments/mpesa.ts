const express = require('express')
const crypto = require('crypto')
const { supabase } = require('../lib/supabase')

const router = express.Router()

function getMpesaConfig() {
  const cfg = {
    consumerKey: process.env.MPESA_CONSUMER_KEY || process.env.CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || process.env.CONSUMER_SECRET || '',
    shortCode: process.env.MPESA_SHORTCODE || process.env.BUSINESS_SHORT_CODE || '',
    passkey: process.env.MPESA_PASSKEY || process.env.PASSKEY || '',
    callbackUrl: process.env.MPESA_CALLBACK_URL || process.env.CALLBACK_URL || '',
    environment: (process.env.MPESA_ENVIRONMENT || 'sandbox').toLowerCase(),
    transactionType: process.env.MPESA_TRANSACTION_TYPE || process.env.TRANSACTION_TYPE || 'CustomerPayBillOnline'
  }
  const missing = []
  if (!cfg.consumerKey) missing.push('MPESA_CONSUMER_KEY')
  if (!cfg.consumerSecret) missing.push('MPESA_CONSUMER_SECRET')
  if (!cfg.shortCode) missing.push('MPESA_SHORTCODE')
  if (!cfg.passkey) missing.push('MPESA_PASSKEY')
  if (!cfg.callbackUrl) missing.push('MPESA_CALLBACK_URL')
  const baseUrl = cfg.environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'
  const isCallbackValid = /^https:\/\//.test(cfg.callbackUrl)
  if (!['sandbox', 'production'].includes(cfg.environment)) {
    console.warn('[MPESA_CONFIG] Unknown MPESA_ENVIRONMENT, defaulting to sandbox:', cfg.environment)
  }
  return { cfg, missing, baseUrl, isCallbackValid }
}

function toTimestamp() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('')
}

function sanitizePhoneLocal(phone: string) {
  const raw = phone.replace(/\s+/g, '')
  if (/^(?:07\d{8}|011\d{7})$/.test(raw)) {
    if (raw.startsWith('07')) return `254${raw.substring(1)}`
    if (raw.startsWith('011')) return `254${raw.substring(3)}`
  }
  throw new Error('Invalid Kenyan phone number format')
}

const rateLimitStore: Record<string, { count: number; resetAt: number }> = {}
function rateLimit(ip: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  const entry = rateLimitStore[ip]
  if (!entry || now > entry.resetAt) {
    rateLimitStore[ip] = { count: 1, resetAt: now + windowMs }
    return true
  }
  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

router.get('/csrf', (req, res) => {
  const token = crypto.randomBytes(16).toString('hex')
  res.cookie('csrf_token', token, {
    httpOnly: false,
    sameSite: 'Strict',
    secure: true,
    maxAge: 30 * 60 * 1000
  })
  res.status(200).json({ success: true, token })
})

router.post('/mpesa/initiate', async (req, res) => {
  try {
    console.log('[MPESA_INITIATE] incoming body:', req.body)
    const { cfg, missing, baseUrl, isCallbackValid } = getMpesaConfig()
    if (missing.length > 0) {
      return res.status(500).json({ success: false, error: `Payment not configured: missing ${missing.join(', ')}` })
    }
    if (!isCallbackValid) {
      return res.status(400).json({ success: false, error: 'Invalid MPESA_CALLBACK_URL: must be https' })
    }

    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || 'unknown'
    if (!rateLimit(ip)) {
      return res.status(429).json({ success: false, error: 'Too many attempts. Try later.' })
    }

    const csrfHeader = req.headers['x-csrf-token']
    const cookieHeader = req.headers['cookie'] || ''
    const csrfCookie = (cookieHeader as string)
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('csrf_token='))
      ?.split('=')[1]
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return res.status(403).json({ success: false, error: 'CSRF token invalid' })
    }

    const { sessionId, phoneNumber } = req.body || {}
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, error: 'sessionId required' })
    }
    const msisdn = sanitizePhoneLocal(String(phoneNumber || ''))
    console.log('[MPESA_INITIATE] normalized msisdn:', msisdn)

    const { data: existing } = await supabase
      .from('payments')
      .select('id, status, created_at, transaction_id')
      .ilike('transaction_id', `%${sessionId}%`)
      .gte('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing && existing.status === 'pending') {
      return res.status(200).json({ success: true, checkoutRequestID: existing.transaction_id?.split('|')[0] })
    }

    const ts = toTimestamp()
    console.log('[MPESA_INITIATE] env:', { env: cfg.environment, shortCode: cfg.shortCode, callbackUrl: cfg.callbackUrl })
    const shortCode = cfg.shortCode
    const passkey = cfg.passkey
    const password = Buffer.from(`${shortCode}${passkey}${ts}`).toString('base64')

    const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64')
    const getToken = async () => {
      const r = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` }
      })
      if (!r.ok) throw new Error('Failed to get M-Pesa token')
      return r.json()
    }
    let tokenJson
    try {
      tokenJson = await getToken()
    } catch {
      tokenJson = await getToken()
    }
    const accessToken = tokenJson.access_token
    console.log('[MPESA_INITIATE] token acquired:', !!accessToken)

    const stkBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: ts,
      TransactionType: cfg.transactionType,
      Amount: 1,
      PartyA: msisdn,
      PartyB: shortCode,
      PhoneNumber: msisdn,
      CallBackURL: cfg.callbackUrl,
      AccountReference: `LAB REPORT`,
      TransactionDesc: 'Payment KSH 1 for draft access'
    }
    console.log('[MPESA_INITIATE] STK body:', { ...stkBody, Password: '[redacted]' })

    const push = async () => {
      const r = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkBody)
      })
      const j = await r.json()
      if (!r.ok || j.errorCode) throw new Error(j.errorMessage || 'STK push failed')
      return j
    }
    let stkJson
    try {
      stkJson = await push()
    } catch {
      stkJson = await push()
    }
    console.log('[MPESA_INITIATE] STK response:', stkJson)

    const checkoutId = stkJson.CheckoutRequestID || stkJson.MerchantRequestID || crypto.randomUUID()
    console.log('[MPESA_INITIATE] checkoutId:', checkoutId)

    const { data: draftRow } = await supabase
      .from('drafts')
      .select('user_id')
      .eq('session_id', sessionId)
      .maybeSingle()

    let userId = draftRow?.user_id || null
    if (!userId) {
      const { data: reportRow } = await supabase
        .from('reports')
        .select('user_id')
        .eq('session_id', sessionId)
        .maybeSingle()
      userId = reportRow?.user_id || userId
    }
    if (!userId) {
      const { data: sessionRow } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('id', sessionId)
        .maybeSingle()
      userId = sessionRow?.user_id || userId
    }
    console.log('[MPESA_INITIATE] resolved userId:', userId)

    const { error: insertError } = await supabase.from('payments').insert({
      user_id: userId,
      amount: 1,
      method: 'mpesa',
      status: 'pending',
      transaction_id: `${checkoutId}|${sessionId}|${stkBody.AccountReference}`,
      phone_number: msisdn
    })
    if (insertError) {
      console.error('[MPESA_INITIATE] insert payments error:', insertError?.message)
      return res.status(500).json({ success: false, error: 'Failed to record payment initiation' })
    }

    const masked = msisdn.replace(/(\d{3})\d{5}(\d{2})/, '$1*****$2')
    await supabase.from('admin_logs').insert({
      action: 'payment_attempt',
      target_type: 'payment',
      target_id: null,
      details: { sessionId, checkoutId, amount: 1, msisdn: masked },
      timestamp: new Date().toISOString()
    })

    res.status(200).json({ success: true, checkoutRequestID: checkoutId })
  } catch (err: any) {
    const message = err?.message || 'Payment initiation error'
    console.error('[MPESA_INITIATE_ERROR]', message)
    const safeEnv = {
      env: (process.env.MPESA_ENVIRONMENT || 'sandbox'),
      callbackUrlSet: !!(process.env.MPESA_CALLBACK_URL || process.env.CALLBACK_URL)
    }
    console.error('[MPESA_INITIATE_ERROR_ENV]', safeEnv)
    res.status(500).json({ success: false, error: message })
  }
})

router.post('/mpesa/callback', express.json(), async (req, res) => {
  try {
    const body = req.body || {}
    console.log('[MPESA_CALLBACK] raw body:', JSON.stringify(body))
    const stk = body.Body?.stkCallback
    const resultCode = stk?.ResultCode
    const checkoutId = stk?.CheckoutRequestID
    const items = stk?.CallbackMetadata?.Item || []
    const accountRef = items.find((i: any) => i.Name === 'AccountReference')?.Value || null
    const mpesaCode = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value || null
    const cbPhone = items.find((i: any) => i.Name === 'PhoneNumber')?.Value || null

    let status = 'failed'
    if ((resultCode === 0 || resultCode === '0') && mpesaCode) status = 'success'
    else if ((resultCode === 0 || resultCode === '0') && !mpesaCode) status = 'failed'

    const { error: updateError } = await supabase
      .from('payments')
      .update({ status, mpesa_code: mpesaCode, phone_number: cbPhone || null })
      .ilike('transaction_id', `%${checkoutId}%`)
    if (updateError) {
      console.error('[MPESA_CALLBACK] update error:', updateError?.message)
      return res.status(500).json({ success: false, error: 'Failed to update payment status' })
    }

    console.log('[MPESA_CALLBACK]', { status, checkoutId, accountRefPresent: !!accountRef })
    res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('[MPESA_CALLBACK_ERROR]', err?.message)
    res.status(500).json({ success: false, error: err?.message || 'Callback error' })
  }
})

router.get('/mpesa/status', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    const sessionId = String(req.query.sessionId || '')
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' })
    console.log('[MPESA_STATUS] sessionId:', sessionId)

    let { data, error } = await supabase
      .from('payments')
      .select('status, transaction_id, phone_number, mpesa_code')
      .ilike('transaction_id', `%${sessionId}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[MPESA_STATUS] query error:', error?.message)
      return res.status(500).json({ success: false, error: error.message })
    }
    if (!data) {
      console.log('[MPESA_STATUS] no payment found, trying AccountReference prefix')
      const pref = `SciDraft-${sessionId}`
      const fallback = await supabase
        .from('payments')
        .select('status, transaction_id, phone_number, mpesa_code')
        .ilike('transaction_id', `%${pref}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (fallback.error) {
        console.error('[MPESA_STATUS] fallback query error:', fallback.error?.message)
        return res.status(500).json({ success: false, error: fallback.error.message })
      }
      data = fallback.data
      if (!data) {
        console.log('[MPESA_STATUS] still no payment found for sessionId')
        return res.status(404).json({ success: false, error: 'No payment found' })
      }
    }
    if (data.status === 'success' && data.mpesa_code && data.phone_number) {
      const secret = process.env.COOKIE_SECRET || 'scidraft-secret'
      const sig = crypto.createHmac('sha256', secret).update(sessionId).digest('hex')
      const token = Buffer.from(`${sessionId}.${sig}`).toString('base64')
      res.cookie('paid_session', token, {
        httpOnly: true,
        sameSite: 'Strict',
        secure: true,
        maxAge: 30 * 60 * 1000
      })
      return res.status(200).json({ success: true, status: 'success', mpesa_code: data.mpesa_code, phone_number: data.phone_number })
    }
    return res.status(200).json({ success: true, status: data.status, mpesa_code: data.mpesa_code, phone_number: data.phone_number })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Status error' })
  }
})

module.exports = router
