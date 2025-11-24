import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export function validateKenyanLocal(msisdn: string) {
  const raw = msisdn.replace(/\s+/g, '')
  if (/^(?:07\d{8}|011\d{7})$/.test(raw)) return true
  return false
}

export function to254(msisdn: string) {
  const raw = msisdn.replace(/\s+/g, '')
  if (raw.startsWith('07')) return `254${raw.substring(1)}`
  if (raw.startsWith('011')) return `254${raw.substring(3)}`
  return raw
}

export function PaymentPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    let timer: any
    if (loading) {
      timer = setTimeout(() => setTimeoutReached(true), 120000)
    }
    return () => timer && clearTimeout(timer)
  }, [loading])

  const startPayment = async () => {
    setError('')
    if (!sessionId) {
      setError('Missing session ID')
      return
    }
    if (!validateKenyanLocal(phone)) {
      setError('Enter a valid Kenyan phone like 0727921038 or 0111234567')
      return
    }
    setLoading(true)
    try {
      console.log('[PAYMENT_PAGE] starting payment for session:', sessionId)
      const csrf = await fetch('/api/payments/csrf', { cache: 'no-store' })
      const csrfJson = await csrf.json()
      const token = csrfJson.token

      const payload = { sessionId, phoneNumber: phone }
      console.log('[PAYMENT_PAGE] payload:', payload)
      const resp = await fetch('/api/payments/mpesa/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token
        },
        body: JSON.stringify(payload)
      })
      const json = await resp.json()
      console.log('[PAYMENT_PAGE] initiate response:', json)
      if (!resp.ok || !json.success) {
        throw new Error(json.error || 'Payment initiation failed')
      }
      setCheckoutId(json.checkoutRequestID || null)

      const start = Date.now()
      while (Date.now() - start < 120000) {
        await new Promise((r) => setTimeout(r, 3000))
        const statusResp = await fetch(`/api/payments/mpesa/status?sessionId=${sessionId}`, { cache: 'no-store' })
        const statusJson = await statusResp.json()
        console.log('[PAYMENT_PAGE] status poll:', statusJson)
        if (statusResp.ok && statusJson.success && statusJson.status === 'failed') {
          setError('Payment failed to capture MPESA code. Please try again.')
          break
        }
        if (statusResp.ok && statusJson.success && statusJson.status === 'success' && statusJson.mpesa_code && statusJson.phone_number) {
          navigate(`/draft-viewer/${sessionId}`, { state: { receipt: {
            mpesaCode: statusJson.mpesa_code,
            amount: 1,
            phone: statusJson.phone_number || to254(phone),
            timestamp: new Date().toISOString()
          } } })
          return
        }
      }
      throw new Error('Payment timeout. Please try again.')
    } catch (e: any) {
      console.error('[PAYMENT_PAGE] error:', e?.message)
      setError(e?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">M-Pesa Payment</h1>
        <p className="text-gray-600 mb-6">Payment Amount: KSH 1</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0727921038 or 0111234567"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          disabled={loading}
        />
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}

        <button
          onClick={startPayment}
          disabled={loading}
          className="mt-6 w-full inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Pay Now</span>
            </>
          )}
        </button>

        {checkoutId && (
          <p className="text-xs text-gray-500 mt-3">Checkout ID: {checkoutId}</p>
        )}
        {timeoutReached && (
          <p className="text-xs text-amber-600 mt-3">Payment is taking longer than expected. You can retry.</p>
        )}
      </div>
    </div>
  )
}
