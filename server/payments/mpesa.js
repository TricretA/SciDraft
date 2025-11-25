const express = require('express')
const crypto = require('crypto')
const { supabase } = require('../../lib/server/supabase.cjs')
const { FIXED_UNLOCK_AMOUNT_KSH } = require('./constants.js')

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
  const baseUrl = cfg.environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'
  return { cfg, baseUrl }
}

function toTimestamp() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate()), pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('')
}

router.get('/csrf', (req, res) => {
  const token = crypto.randomBytes(16).toString('hex')
  res.cookie('csrf_token', token, { httpOnly: false, sameSite: 'Strict', secure: true, maxAge: 30 * 60 * 1000 })
  res.status(200).json({ success: true, token })
})

router.post('/mpesa/initiate', async (req, res) => {
  try {
    const { cfg, baseUrl } = getMpesaConfig()
    const csrfHeader = req.headers['x-csrf-token']
    const cookieHeader = req.headers['cookie'] || ''
    const csrfCookie = (cookieHeader || '')
      .split(';').map(c => c.trim()).find(c => c.startsWith('csrf_token='))?.split('=')[1]
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return res.status(403).json({ success: false, error: 'CSRF token invalid' })
    }
    const sessionId = String(req.body.sessionId || '')
    const phoneNumber = String(req.body.phoneNumber || '')
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' })
    const msisdn = phoneNumber.replace(/\s+/g, '')

    const ts = toTimestamp()
    const shortCode = cfg.shortCode
    const passkey = cfg.passkey
    const password = Buffer.from(`${shortCode}${passkey}${ts}`).toString('base64')

    const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64')
    const getToken = async () => {
      const r = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { method: 'GET', headers: { Authorization: `Basic ${auth}` } })
      if (!r.ok) throw new Error('Failed to get M-Pesa token')
      return r.json()
    }
    let tokenJson
    try { tokenJson = await getToken() } catch { tokenJson = await getToken() }
    const accessToken = tokenJson.access_token

    const stkBody = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: ts,
      TransactionType: cfg.transactionType,
      Amount: FIXED_UNLOCK_AMOUNT_KSH,
      PartyA: msisdn,
      PartyB: shortCode,
      PhoneNumber: msisdn,
      CallBackURL: cfg.callbackUrl,
      AccountReference: 'LAB REPORT',
      TransactionDesc: 'Payment KSH 50 for draft access'
    }

    const push = async () => {
      const r = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(stkBody) })
      const j = await r.json()
      if (!r.ok || j.errorCode) throw new Error(j.errorMessage || 'STK push failed')
      return j
    }
    let stkJson
    try { stkJson = await push() } catch { stkJson = await push() }

    const checkoutId = stkJson.CheckoutRequestID || stkJson.MerchantRequestID || crypto.randomUUID()

    await supabase.from('payments').insert({ user_id: null, amount: FIXED_UNLOCK_AMOUNT_KSH, method: 'mpesa', status: 'pending', transaction_id: `${checkoutId}|${sessionId}|${stkBody.AccountReference}`, phone_number: msisdn })

    res.status(200).json({ success: true, checkoutRequestID: checkoutId, amount: FIXED_UNLOCK_AMOUNT_KSH })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Payment initiation error' })
  }
})

router.get('/mpesa/status', async (req, res) => {
  try {
    const sessionId = String(req.query.sessionId || '')
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' })
    const { data, error } = await supabase
      .from('payments')
      .select('status, transaction_id, phone_number, mpesa_code')
      .ilike('transaction_id', `%${sessionId}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) return res.status(500).json({ success: false, error: error.message })
    if (!data) return res.status(404).json({ success: false, error: 'No payment found' })
    return res.status(200).json({ success: true, status: data.status, mpesa_code: data.mpesa_code, phone_number: data.phone_number, amount: FIXED_UNLOCK_AMOUNT_KSH })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Status error' })
  }
})

module.exports = router

