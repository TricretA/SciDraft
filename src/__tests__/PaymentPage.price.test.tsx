import { describe, it, expect } from 'vitest'
import { FIXED_UNLOCK_AMOUNT_KSH } from '../pages/Payment'

describe('PaymentPage pricing', () => {
  it('exports fixed amount constant = 50', () => {
    expect(FIXED_UNLOCK_AMOUNT_KSH).toBe(50)
  })
})
