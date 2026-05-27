import { WDKCheckoutError } from '../core/WDKCheckoutError'

describe('WDKCheckoutError', () => {
  it('sets code and message', () => {
    const err = new WDKCheckoutError('WALLET_INIT_FAILED', 'seed not found')
    expect(err.code).toBe('WALLET_INIT_FAILED')
    expect(err.message).toBe('seed not found')
    expect(err.name).toBe('WDKCheckoutError')
  })

  it('is instanceof Error', () => {
    const err = new WDKCheckoutError('BROADCAST_FAILED', 'rpc error')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(WDKCheckoutError)
  })
})
