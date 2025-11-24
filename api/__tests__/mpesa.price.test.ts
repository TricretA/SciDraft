import { describe, it, expect } from 'vitest'

describe('MPesa backend pricing', async () => {
  it('exposes fixed amount constant = 50', async () => {
    const constants: any = await import('../../api/payments/constants.ts')
    expect(constants.FIXED_UNLOCK_AMOUNT_KSH).toBe(50)
  })
})
