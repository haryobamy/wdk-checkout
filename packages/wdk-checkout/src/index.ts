// Components
export { WDKCheckoutProvider } from './components/WDKCheckoutProvider'
export { WDKCheckout } from './components/WDKCheckout'
export { WDKWalletSetup } from './components/WDKWalletSetup'

// Hooks
export { useWDKPayment } from './hooks/useWDKPayment'
export { useWDKReceive } from './hooks/useWDKReceive'
export { useWalletState } from './hooks/useWalletState'

// Types
export type {
  Network,
  NetworkConfig,
  WDKCheckoutConfig,
  PaymentParams,
  PaymentResult,
  FeeEstimate,
  PaymentStatus,
  IncomingPayment,
  WatchOptions,
  UseWDKPaymentOptions,
  UseWDKReceiveOptions,
  WDKCheckoutProps,
} from './types'

// Error
export { WDKCheckoutError } from './core/WDKCheckoutError'
export type { WDKCheckoutErrorCode } from './core/WDKCheckoutError'

// SecretStore interface (for custom adapters)
export type { SecretStore } from './storage/SecretStore'

// Testing utilities
export { MemorySecretStore } from './testing/MemorySecretStore'
export { LocalStorageSecretStore } from './testing/LocalStorageSecretStore'
