export type WDKCheckoutErrorCode =
  | 'WALLET_INIT_FAILED'
  | 'BIOMETRIC_CANCELLED'
  | 'BIOMETRIC_UNAVAILABLE'
  | 'INSUFFICIENT_BALANCE'
  | 'BROADCAST_FAILED'
  | 'CONFIRMATION_TIMEOUT'
  | 'WEB_STORAGE_REQUIRED'
  | 'NETWORK_UNSUPPORTED'

export class WDKCheckoutError extends Error {
  readonly code: WDKCheckoutErrorCode

  constructor(code: WDKCheckoutErrorCode, message: string) {
    super(message)
    this.name = 'WDKCheckoutError'
    this.code = code
    Object.setPrototypeOf(this, WDKCheckoutError.prototype)
  }
}
