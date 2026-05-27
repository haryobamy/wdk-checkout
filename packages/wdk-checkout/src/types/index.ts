export type Network = 'ethereum' | 'polygon' | 'sepolia'

export interface NetworkConfig {
  rpcUrl: string
  chainId: number
  usdtAddress: string
  // ERC-4337 gasless fields — all required together if gasless is enabled
  bundlerUrl?: string
  entryPointAddress?: string
  safeModulesVersion?: string
  // Passthrough for any additional ERC-4337 config (paymasterUrl, isSponsored, etc.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  erc4337?: Record<string, any>
}

export interface WDKCheckoutConfig {
  networks: Partial<Record<Network, NetworkConfig>>
  gasless?: boolean
  secretStore?: import('../storage/SecretStore').SecretStore
  confirmationTimeout?: number  // ms, default 300_000
  pollInterval?: number         // ms, default 3_000
}

export interface PaymentParams {
  amount: string   // decimal string, e.g. "5.00"
  currency: 'USDT'
}

export interface FeeEstimate {
  fee: bigint
  formatted: string  // e.g. "0.001234 ETH"
}

export interface PaymentResult {
  txHash: string
  amount: string
  network: Network
  fee: bigint
}

export interface IncomingPayment {
  txHash: string
  from: string
  amount: bigint
  timestamp: number
}

export interface WatchOptions {
  expectedAmount: string
  currency: 'USDT'
  onReceived: (payment: IncomingPayment) => void
  timeout?: number
}

export type PaymentStatus =
  | 'idle'
  | 'initializing'
  | 'awaiting_wallet'
  | 'ready'
  | 'quoting'
  | 'confirming_send'
  | 'broadcasting'
  | 'confirming_receipt'
  | 'success'
  | 'error'

export interface UseWDKPaymentOptions {
  network: Network
  recipientAddress: string
  gasless?: boolean
}

export interface UseWDKReceiveOptions {
  network: Network
  accountIndex?: number
}

export interface WDKCheckoutProps {
  amount: string
  currency: 'USDT'
  network: Network
  recipientAddress: string
  onSuccess: (result: PaymentResult) => void
  onCancel: () => void
  onError: (error: import('../core/WDKCheckoutError').WDKCheckoutError) => void
}
