import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Smartphone, Lock } from 'lucide-react'

export const FIXED_UNLOCK_AMOUNT_KSH = 40

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
  const [method, setMethod] = useState<'mpesa' | 'stripe' | null>('mpesa')
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [touched, setTouched] = useState(false)

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
            amount: FIXED_UNLOCK_AMOUNT_KSH,
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
    <div className="relative min-h-[100dvh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 -z-10 opacity-60 gradient-animate" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <div className="flex items-center gap-2 text-white/70">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Secure payment</span>
          </div>
        </div>
        <p className="mb-6 text-white/80 text-sm">Pay to unlock your full report and enable exports. You’ll get a prompt on your phone and access to the completed report with download options.</p>

        <div className="sticky top-0 z-10 mb-6">
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map((s) => (
              <div key={s} className={`h-1 rounded ${s <= step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white/10'}`} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/70">
            <span>Select Method</span>
            <span>Enter Details</span>
            <span>Confirm & Pay</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-lg shadow-purple-500/10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-4">Choose payment method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setMethod('mpesa'); setStep(2) }}
                    className={`group rounded-xl border ${method==='mpesa' ? 'border-blue-400' : 'border-white/10'} bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60 p-4 text-left hover:border-blue-400 transition`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="font-medium">M-Pesa (STK Push)</div>
                        <div className="text-sm text-white/70">Fast mobile checkout</div>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-2">Enter details</h2>
                <p className="text-white/70 mb-4" data-testid="amount-label">Amount: <span className="text-white font-medium">KSh {FIXED_UNLOCK_AMOUNT_KSH}</span></p>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">M-Pesa Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setTouched(true) }}
                  placeholder="0727921038 or 0111234567"
                  className={`w-full rounded-lg px-3 py-2 border bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${error && touched ? 'border-red-500 animate-shakeX' : 'border-white/20'}`}
                  disabled={loading}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'phone-error' : undefined}
                />
                {error && (
                  <p id="phone-error" role="alert" className="text-red-500 text-sm mt-2">{error}</p>
                )}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white/90 hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 font-medium shadow-lg shadow-purple-500/20"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold mb-2">Confirm & pay</h2>
                <div className="mb-4 text-sm text-white/80">You’ll receive an M-Pesa prompt on <span className="font-medium">{to254(phone) || 'your phone'}</span>.</div>
                <button
                  onClick={startPayment}
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>Processing payment...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      <span>Pay with M-Pesa</span>
                    </>
                  )}
                </button>
                {loading && (
                  <p className="text-xs text-white/70 mt-3" aria-live="polite">Waiting for M-Pesa prompt and confirmation…</p>
                )}
                {checkoutId && (
                  <p className="text-xs text-white/60 mt-3">Checkout ID: {checkoutId}</p>
                )}
                {timeoutReached && (
                  <p className="text-xs text-amber-400 mt-3">Payment is taking longer than expected. You can retry.</p>
                )}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white/90 hover:bg-white/10"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
