# wdk-checkout

Self-custodial USDT checkout for React Native and React, powered by [Tether WDK](https://docs.wdk.tether.io/).

## Install

```bash
npm install wdk-checkout react-native-keychain
```

## Quick start

```tsx
import { WDKCheckoutProvider, WDKCheckout } from 'wdk-checkout'

<WDKCheckoutProvider config={{
  networks: {
    ethereum: {
      rpcUrl: 'https://eth.drpc.org',
      chainId: 1,
      usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    }
  }
}}>
  <WDKCheckout
    amount="5.00"
    currency="USDT"
    network="ethereum"
    recipientAddress="0xYOUR_ADDRESS"
    onSuccess={(r) => console.log(r.txHash)}
    onCancel={() => {}}
    onError={(e) => console.error(e.code)}
  />
</WDKCheckoutProvider>
```

## API

### `<WDKCheckoutProvider config={...}>`

Top-level context provider. Wrap your app with this.

| Prop | Type | Description |
|------|------|-------------|
| `config.networks` | `Record<Network, NetworkConfig>` | RPC URL, chainId, USDT address per network |
| `config.gasless` | `boolean` | Enable ERC-4337 gasless payments (default: false) |
| `config.secretStore` | `SecretStore` | Override seed phrase storage (default: keychain on native, throws on web) |
| `config.confirmationTimeout` | `number` | Receipt polling timeout in ms (default: 300000) |
| `config.pollInterval` | `number` | Receipt polling interval in ms (default: 3000) |

### `<WDKCheckout ...>`

Drop-in checkout component. Handles wallet setup, fee display, and payment confirmation.

### `useWDKPayment(options)`

State machine hook for payment flows.

```ts
const {
  status,          // PaymentStatus
  walletAddress,   // string | null
  feeEstimate,     // { fee: bigint, formatted: string } | null
  txHash,          // string | null
  error,           // WDKCheckoutError | null
  initiatePayment, // (params: { amount: string, currency: 'USDT' }) => void
  confirmPayment,  // () => void
  cancelPayment,   // () => void
  createWallet,    // () => Promise<void>
} = useWDKPayment({ network: 'ethereum', recipientAddress: '0x...' })
```

### `useWDKReceive(options)`

Seller-side hook to get the wallet address for receiving payments.

```ts
const { address } = useWDKReceive({ network: 'ethereum' })
```

### `WDKCheckoutError`

All errors are instances of `WDKCheckoutError` with a `code` property:

| Code | Description |
|------|-------------|
| `WALLET_INIT_FAILED` | Failed to initialize wallet (bad seed, network error) |
| `BIOMETRIC_CANCELLED` | User cancelled biometric prompt |
| `BIOMETRIC_UNAVAILABLE` | Biometrics not available on device |
| `INSUFFICIENT_BALANCE` | Wallet has insufficient USDT or ETH for fees |
| `BROADCAST_FAILED` | Transaction rejected or reverted |
| `CONFIRMATION_TIMEOUT` | Transaction not confirmed within timeout |
| `WEB_STORAGE_REQUIRED` | No `secretStore` provided on web platform |
| `NETWORK_UNSUPPORTED` | Network not in provider config |

## Networks

| Network | Chain ID |
|---------|----------|
| `ethereum` | 1 |
| `polygon` | 137 |
| `sepolia` | 11155111 (testnet) |

## Gasless payments (ERC-4337)

Enable gasless payments by providing bundler configuration:

```ts
{
  networks: {
    ethereum: {
      rpcUrl: '...',
      chainId: 1,
      usdtAddress: '0xdAC17F...',
      bundlerUrl: 'https://bundler.example.com',
      entryPointAddress: '0x5FF1...',
      erc4337: { isSponsored: true, paymasterUrl: '...' }
    }
  },
  gasless: true
}
```

## Custom SecretStore

Implement `SecretStore` to use your own key storage:

```ts
import type { SecretStore } from 'wdk-checkout'

class MyStore implements SecretStore {
  async save(seed: string): Promise<void> { /* ... */ }
  async load(): Promise<string | null> { /* ... */ }
  async clear(): Promise<void> { /* ... */ }
  async exists(): Promise<boolean> { /* ... */ }
}
```

## Testing

Use `MemorySecretStore` in tests:

```ts
import { MemorySecretStore } from 'wdk-checkout'

const store = new MemorySecretStore()
await store.save('your twelve word seed phrase ...')
```

## License

MIT
