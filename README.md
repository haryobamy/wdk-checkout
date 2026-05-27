# wdk-checkout

> Self-custodial USDT checkout for React Native and React — powered by [Tether WDK](https://docs.wdk.tether.io/)

`wdk-checkout` lets you add a fully self-custodial USDT payment flow to any React Native or React app in minutes. The buyer's wallet lives on their device, secured by biometrics. No custodian. No third-party. No signups. Just crypto.

## Features

- **Drop-in or headless** — use `<WDKCheckout>` for an instant UI, or `useWDKPayment` for full control
- **Self-custodial** — seed phrases are generated on-device and never sent to a server
- **Biometric secured** — native platforms use the device's secure enclave (Face ID / Touch ID / PIN)
- **Real-time fee estimation** — users see the exact gas cost before confirming
- **ERC-4337 / gasless support** — optional bundler integration to sponsor gas on behalf of users
- **Multi-network** — Ethereum mainnet, Polygon, and Sepolia testnet supported out of the box
- **Web compatible** — works in Next.js / browser environments via a custom `SecretStore`
- **TypeScript first** — full type definitions included

---

## How it works

```
User taps "Pay"
  → App unlocks their on-device wallet (biometric / PIN)
  → Fetches a real-time fee estimate
  → Shows the user the amount + fee to confirm
  → User confirms → transaction is broadcast to the chain
  → App polls for on-chain confirmation
  → onSuccess fires with the txHash
```

The seed phrase is generated once, encrypted by the device's secure enclave, and never leaves the device.

---

## Installation

```bash
# npm
npm install wdk-checkout react-native-keychain

# yarn
yarn add wdk-checkout react-native-keychain

# pnpm
pnpm add wdk-checkout react-native-keychain
```

> **React Native only:** Run `npx pod-install` after installing to link the native keychain module.

> **Web / Next.js:** `react-native-keychain` is not required. Pass a custom `secretStore` to `WDKCheckoutProvider` (see [Web usage](#web--nextjs-usage)).

---

## Quick start (React Native / Expo)

### 1. Wrap your app with the provider

```tsx
// App.tsx
import { WDKCheckoutProvider } from 'wdk-checkout'

const config = {
  networks: {
    ethereum: {
      rpcUrl: 'https://eth.drpc.org',
      chainId: 1,
      usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  },
}

export default function App() {
  return (
    <WDKCheckoutProvider config={config}>
      <YourAppNavigator />
    </WDKCheckoutProvider>
  )
}
```

### 2. Drop in the checkout component

```tsx
// CheckoutScreen.tsx
import { WDKCheckout } from 'wdk-checkout'

export function CheckoutScreen() {
  return (
    <WDKCheckout
      amount="5.00"
      currency="USDT"
      network="ethereum"
      recipientAddress="0xYOUR_SELLER_WALLET_ADDRESS"
      onSuccess={(result) => {
        console.log('Payment confirmed!', result.txHash)
        // navigate to success screen
      }}
      onCancel={() => {
        // user tapped Cancel
      }}
      onError={(error) => {
        console.error(error.code, error.message)
      }}
    />
  )
}
```

That's it. `WDKCheckout` handles everything — wallet creation (first time), fee estimation, confirmation prompt, broadcasting, and receipt polling.

---

## Web / Next.js usage

On web, `react-native-keychain` is not available. You must provide a `secretStore` yourself. For demos, `MemorySecretStore` works. For production, implement your own encrypted storage (e.g. Web Crypto API + IndexedDB).

```tsx
// app/providers.tsx  (Next.js App Router)
'use client'
import { WDKCheckoutProvider, MemorySecretStore } from 'wdk-checkout'
import { useMemo } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // MemorySecretStore is for demos only — not persistent across page reloads
  const secretStore = useMemo(() => new MemorySecretStore(), [])

  return (
    <WDKCheckoutProvider
      config={{
        networks: {
          ethereum: {
            rpcUrl: 'https://eth.drpc.org',
            chainId: 1,
            usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          },
        },
        secretStore,
      }}
    >
      {children}
    </WDKCheckoutProvider>
  )
}
```

```tsx
// app/page.tsx
'use client'
import { WDKCheckout } from 'wdk-checkout'

export default function StorePage() {
  return (
    <WDKCheckout
      amount="5.00"
      currency="USDT"
      network="ethereum"
      recipientAddress="0xYOUR_SELLER_WALLET_ADDRESS"
      onSuccess={(r) => alert(`Paid! tx: ${r.txHash}`)}
      onCancel={() => {}}
      onError={(e) => alert(e.message)}
    />
  )
}
```

---

## Supported networks

| Network    | `network` value | Chain ID | USDT contract |
|------------|-----------------|----------|---------------|
| Ethereum   | `"ethereum"`    | `1`      | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| Polygon    | `"polygon"`     | `137`    | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |
| Sepolia    | `"sepolia"`     | `11155111` | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |

---

## API reference

### `<WDKCheckoutProvider>`

Wrap your app (or checkout screen) with this provider. It holds your network config and exposes it to all child hooks and components.

```tsx
<WDKCheckoutProvider config={config}>
  {children}
</WDKCheckoutProvider>
```

#### `config` options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `networks` | `Partial<Record<Network, NetworkConfig>>` | — | **Required.** Network config keyed by network name |
| `gasless` | `boolean` | `false` | Enable ERC-4337 gasless payments via a bundler |
| `secretStore` | `SecretStore` | Keychain (native) | Custom seed phrase storage adapter |
| `confirmationTimeout` | `number` (ms) | `300000` (5 min) | How long to wait for on-chain receipt before timing out |
| `pollInterval` | `number` (ms) | `3000` (3 sec) | How often to poll for the transaction receipt |

#### `NetworkConfig` shape

```ts
{
  rpcUrl: string           // JSON-RPC endpoint for this network
  chainId: number          // EIP-155 chain ID
  usdtAddress: string      // USDT ERC-20 contract address
  // ERC-4337 gasless fields (all required together if gasless: true)
  bundlerUrl?: string
  entryPointAddress?: string
  safeModulesVersion?: string
  erc4337?: Record<string, any>  // Extra bundler config (paymasterUrl, isSponsored, etc.)
}
```

---

### `<WDKCheckout>`

The all-in-one drop-in checkout component. Renders the right UI for every state automatically:

- **First time user** → shows wallet creation screen
- **Returning user** → unlocks wallet via biometrics and fetches fee
- **Fee confirmation** → shows amount + network fee, waits for user to confirm
- **Broadcasting** → shows spinner while tx is sent
- **Confirming** → polls for on-chain receipt
- **Success / Error** → fires your callback

```tsx
<WDKCheckout
  amount="5.00"
  currency="USDT"
  network="ethereum"
  recipientAddress="0x..."
  onSuccess={(result: PaymentResult) => void}
  onCancel={() => void}
  onError={(error: WDKCheckoutError) => void}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `amount` | `string` | Payment amount as a decimal string e.g. `"5.00"` |
| `currency` | `"USDT"` | Currency (currently only USDT) |
| `network` | `Network` | Which network to use — must be configured in the provider |
| `recipientAddress` | `string` | The seller's wallet address that receives the funds |
| `onSuccess` | `(result: PaymentResult) => void` | Fired after on-chain confirmation |
| `onCancel` | `() => void` | Fired when the user taps Cancel |
| `onError` | `(error: WDKCheckoutError) => void` | Fired on any unrecoverable error |

#### `PaymentResult`

```ts
{
  txHash: string    // on-chain transaction hash
  amount: string    // the amount that was sent e.g. "5.00"
  network: Network  // which network the tx was on
  fee: bigint       // gas fee paid in wei
}
```

---

### `useWDKPayment(options)` — build your own UI

If you want full control over the UI, skip `<WDKCheckout>` and use the hook directly.

```tsx
import { useWDKPayment } from 'wdk-checkout'

function MyCheckout() {
  const {
    status,          // current state — see PaymentStatus below
    walletAddress,   // buyer's wallet address once initialized
    feeEstimate,     // { fee: bigint, formatted: string } e.g. "0.001234 ETH"
    txHash,          // set after broadcast
    error,           // WDKCheckoutError | null
    initiatePayment, // call this to kick off the flow
    confirmPayment,  // call this when user confirms the fee
    cancelPayment,   // call this to reset everything
    createWallet,    // call this to generate a new wallet (first-time users)
  } = useWDKPayment({
    network: 'ethereum',
    recipientAddress: '0xYOUR_ADDRESS',
    gasless: false,  // optional, overrides provider default
  })

  // Example: render based on status
  if (status === 'awaiting_wallet') {
    return <Button onPress={createWallet} title="Create wallet" />
  }

  if (status === 'confirming_send' && feeEstimate) {
    return (
      <>
        <Text>Fee: {feeEstimate.formatted}</Text>
        <Button onPress={confirmPayment} title="Confirm & Pay" />
        <Button onPress={cancelPayment} title="Cancel" />
      </>
    )
  }

  return (
    <Button
      onPress={() => initiatePayment({ amount: '5.00', currency: 'USDT' })}
      title="Pay 5.00 USDT"
    />
  )
}
```

#### Payment status flow

```
idle
  └─► initiatePayment()
        └─► initializing      (unlocking wallet)
              ├─► awaiting_wallet   (no wallet found — prompt user to create one)
              └─► ready            (wallet unlocked)
                    └─► quoting         (fetching fee estimate)
                          └─► confirming_send   (waiting for user to confirm)
                                └─► confirmPayment()
                                      └─► broadcasting       (sending tx)
                                            └─► confirming_receipt  (polling for receipt)
                                                  ├─► success
                                                  └─► error
```

| Status | Meaning |
|--------|---------|
| `idle` | Nothing happening yet |
| `initializing` | Unlocking the on-device wallet |
| `awaiting_wallet` | No wallet found — user needs to create one |
| `ready` | Wallet unlocked, fee fetch starting |
| `quoting` | Fetching real-time fee estimate from the network |
| `confirming_send` | Showing fee to user, waiting for confirmation |
| `broadcasting` | Transaction submitted to the network |
| `confirming_receipt` | Polling `eth_getTransactionReceipt` |
| `success` | Transaction confirmed on-chain |
| `error` | Something went wrong — check `error.code` |

---

### `useWDKReceive(options)` — seller side

Use this on the seller / merchant side to display the wallet address where payments should be sent (e.g. to generate a QR code).

```tsx
import { useWDKReceive } from 'wdk-checkout'

function ReceiveScreen() {
  const { address } = useWDKReceive({ network: 'ethereum' })

  if (!address) return <ActivityIndicator />

  return <QRCode value={address} />
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `network` | `Network` | — | Which network to derive the address for |
| `accountIndex` | `number` | `0` | HD wallet account index |

---

### `useWalletState()` — check if a wallet exists

Check whether the user already has a wallet set up on this device.

```tsx
import { useWalletState } from 'wdk-checkout'

function HomeScreen() {
  const { exists, isChecking } = useWalletState()

  if (isChecking) return <Spinner />
  if (!exists) return <OnboardingScreen />
  return <DashboardScreen />
}
```

---

### `WDKCheckoutError`

Every error thrown by this library is a `WDKCheckoutError`. It extends `Error` and adds a `code` property so you can handle specific failure cases.

```ts
try {
  await engine.send('5.00')
} catch (err) {
  if (err instanceof WDKCheckoutError) {
    switch (err.code) {
      case 'INSUFFICIENT_BALANCE':
        showToast('Not enough USDT in your wallet.')
        break
      case 'BIOMETRIC_CANCELLED':
        showToast('Authentication cancelled.')
        break
      default:
        showToast('Payment failed: ' + err.message)
    }
  }
}
```

| Code | When it's thrown |
|------|-----------------|
| `WALLET_INIT_FAILED` | Wallet could not be initialized — missing seed or network error |
| `BIOMETRIC_CANCELLED` | User dismissed the biometric / PIN prompt |
| `BIOMETRIC_UNAVAILABLE` | Device doesn't support biometrics or none are enrolled |
| `INSUFFICIENT_BALANCE` | Wallet doesn't have enough USDT or ETH to cover amount + fee |
| `BROADCAST_FAILED` | RPC rejected the transaction or it reverted on-chain |
| `CONFIRMATION_TIMEOUT` | Receipt not found within `confirmationTimeout` |
| `WEB_STORAGE_REQUIRED` | Running on web with no `secretStore` provided |
| `NETWORK_UNSUPPORTED` | The requested network isn't in the provider config |

---

## Gasless payments (ERC-4337)

Skip gas fees for your users by routing transactions through an ERC-4337 bundler with a paymaster. This uses Tether's `wdk-wallet-evm-erc-4337` under the hood.

```tsx
const config = {
  networks: {
    ethereum: {
      rpcUrl: 'https://eth.drpc.org',
      chainId: 1,
      usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      bundlerUrl: 'https://bundler.yourservice.com/rpc',
      entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      erc4337: {
        isSponsored: true,
        paymasterUrl: 'https://paymaster.yourservice.com/rpc',
      },
    },
  },
  gasless: true,
}
```

> The `erc4337` object is passed directly to `WalletManagerEvmErc4337` — include any extra fields your bundler requires.

---

## Custom `SecretStore`

By default, seed phrases are stored in the device keychain using `react-native-keychain` with biometric protection. To use your own storage backend, implement the `SecretStore` interface:

```ts
import type { SecretStore } from 'wdk-checkout'

class MyEncryptedStore implements SecretStore {
  async save(seed: string): Promise<void> {
    // encrypt and persist seed
  }

  async load(): Promise<string | null> {
    // decrypt and return seed, or null if not set
  }

  async clear(): Promise<void> {
    // delete stored seed
  }

  async exists(): Promise<boolean> {
    // return true if a seed is stored
  }
}

// Pass it to the provider
<WDKCheckoutProvider config={{ ..., secretStore: new MyEncryptedStore() }}>
```

---

## Testing

`MemorySecretStore` is exported for use in tests and web demos. It holds the seed in memory only — safe for tests, **not for production**.

```ts
import { WalletManager, MemorySecretStore } from 'wdk-checkout'

const store = new MemorySecretStore()
await store.save('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')

const manager = new WalletManager({
  network: 'sepolia',
  config: { rpcUrl: '...', chainId: 11155111, usdtAddress: '0x...' },
  gasless: false,
  secretStore: store,
})

const wallet = await manager.init()
console.log(wallet.address) // => 0x...
```

### Integration test (Sepolia)

A real end-to-end test is included. It auto-skips when env vars are absent:

```bash
INTEGRATION_SEED_PHRASE="your twelve words here" \
INTEGRATION_RECIPIENT="0xRECIPIENT_ADDRESS" \
INTEGRATION_RPC_URL="https://rpc.sepolia.org" \
pnpm test -- --testPathPattern=integration
```

---

## Project structure

```
packages/wdk-checkout/
├── src/
│   ├── core/
│   │   ├── WDKCheckoutError.ts     # Typed error class
│   │   ├── WalletManager.ts        # WDK wallet lifecycle (init / dispose)
│   │   ├── PaymentEngine.ts        # quote() and send()
│   │   └── TransactionMonitor.ts   # eth_getTransactionReceipt polling
│   ├── hooks/
│   │   ├── useWDKPayment.ts        # Full payment state machine
│   │   ├── useWDKReceive.ts        # Seller address resolution
│   │   └── useWalletState.ts       # Wallet exists check
│   ├── components/
│   │   ├── WDKCheckoutProvider.tsx  # React context + config
│   │   ├── WDKCheckout.tsx          # Web drop-in component
│   │   ├── WDKCheckout.native.tsx   # React Native drop-in component
│   │   ├── WDKWalletSetup.tsx       # Web wallet creation UI
│   │   └── WDKWalletSetup.native.tsx # RN wallet creation UI
│   ├── storage/
│   │   ├── SecretStore.ts           # Interface + web stub
│   │   └── SecretStore.native.ts    # react-native-keychain implementation
│   └── testing/
│       └── MemorySecretStore.ts     # In-memory store for tests
examples/
├── expo-demo/     # Expo app example
└── nextjs-demo/   # Next.js 14 app example
```

---

## Security

- Seed phrases are stored using `react-native-keychain` with `BIOMETRY_CURRENT_SET` access control and `SECURE_HARDWARE` security level — they live in the device's secure enclave
- The seed phrase is **never transmitted** over the network
- Each transaction requires explicit biometric / PIN confirmation
- Use `ACCESS_CONTROL.BIOMETRY_CURRENT_SET` — the key becomes invalid if biometrics change (e.g. a new fingerprint is added)

---

## TypeScript types reference

Key types exported from `wdk-checkout`:

```ts
import type {
  Network,           // 'ethereum' | 'polygon' | 'sepolia'
  NetworkConfig,
  WDKCheckoutConfig,
  PaymentParams,
  PaymentResult,
  PaymentStatus,
  FeeEstimate,
  WDKCheckoutProps,
  UseWDKPaymentOptions,
  SecretStore,
  WDKCheckoutErrorCode,
} from 'wdk-checkout'
```

**`FeeEstimate`**

```ts
{
  fee: bigint        // gas fee in wei
  formatted: string  // human-readable e.g. "0.001234 ETH"
}
```

**`PaymentParams`**

```ts
{
  amount: string     // decimal string e.g. "5.00"
  currency: 'USDT'
}
```

---

## License

MIT — built on [Tether WDK](https://github.com/tethertechnology/wdk)
