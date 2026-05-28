# wdk-checkout

[![npm version](https://img.shields.io/npm/v/wdk-checkout.svg)](https://www.npmjs.com/package/wdk-checkout)
[![npm downloads](https://img.shields.io/npm/dm/wdk-checkout.svg)](https://www.npmjs.com/package/wdk-checkout)
[![license](https://img.shields.io/npm/l/wdk-checkout.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![powered by Tether WDK](https://img.shields.io/badge/powered%20by-Tether%20WDK-green.svg)](https://docs.wdk.tether.io/)

> Self-custodial USDT checkout for React Native and React — powered by [Tether WDK](https://docs.wdk.tether.io/)

`wdk-checkout` lets you add a fully self-custodial USDT payment flow to any React Native or React app in minutes. The buyer's wallet lives on their device, secured by biometrics. No custodian. No third-party. No signups. Just crypto.

---

## Features

- **Drop-in or headless** — use `<WDKCheckout>` for an instant UI, or `useWDKPayment` for full control
- **Self-custodial** — seed phrases are generated on-device and never sent to a server
- **Biometric secured** — native platforms use the device's secure enclave (Face ID / Touch ID / PIN)
- **Real-time fee estimation** — users see the exact gas cost before confirming
- **Two-step confirmation** — quote first, pay second — users never get surprised by fees
- **ERC-4337 / gasless support** — optional bundler integration to sponsor gas on behalf of users
- **Multi-network** — Ethereum mainnet, Polygon, and Sepolia testnet out of the box
- **Web compatible** — works in Next.js / browser environments via a custom `SecretStore`
- **TypeScript first** — full type definitions included, zero `any` in your code

---

## How it works

```
User taps "Pay"
  → App unlocks their on-device wallet (biometric / PIN)
  → Fetches a real-time fee estimate from the network
  → Shows the user: amount + network fee — waiting for confirmation
  → User confirms → transaction is broadcast to the chain
  → App polls for on-chain receipt
  → onSuccess fires with the txHash and block number
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

**React Native / Expo — link native modules:**

```bash
npx pod-install   # iOS
```

**Web / Next.js — skip `react-native-keychain`:**

`react-native-keychain` is a native module and is not required on web. Just pass a custom `secretStore` to the provider (see [Web usage](#web--nextjs-usage)).

---

## Peer dependencies

| Package | Version | Required on |
|---------|---------|-------------|
| `react` | `>=18.0.0` | All platforms |
| `react-native` | `>=0.73.0` | React Native / Expo only |
| `react-native-keychain` | `>=8.0.0` | React Native / Expo only |

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

That's it. `WDKCheckout` handles everything automatically — wallet creation on first use, biometric unlock, fee display, user confirmation, broadcasting, and receipt polling.

---

## Web / Next.js usage

On web, `react-native-keychain` is unavailable. Provide a `secretStore` yourself. For demos, the built-in `MemorySecretStore` works. For production, implement your own persistent encrypted storage (e.g. Web Crypto API + IndexedDB).

### Required: `next.config.js` webpack fix

The WDK packages use `sodium-universal` which tries to load `sodium-native` (a native C addon). In a browser/Next.js environment this fails. Add the following to your `next.config.js` — it aliases `sodium-universal` directly to its pure JS implementation so all cryptographic functions work correctly in the browser:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'sodium-native': false,
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'sodium-universal': require.resolve('sodium-javascript'),
    }
    return config
  },
}

module.exports = nextConfig
```

Without this you will see one of these errors:
- `Module not found: Can't resolve 'sodium-native'`
- `TypeError: sodium_memzero is not a function`

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

| Network  | `network` value | Chain ID   | USDT contract address |
|----------|-----------------|------------|----------------------|
| Ethereum | `"ethereum"`    | `1`        | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| Polygon  | `"polygon"`     | `137`      | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |
| Sepolia  | `"sepolia"`     | `11155111` | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |

---

## API reference

### `<WDKCheckoutProvider>`

Top-level context provider. Wrap your app or checkout screen with it. All hooks and components must be descendants of this provider.

```tsx
<WDKCheckoutProvider config={config}>
  {children}
</WDKCheckoutProvider>
```

#### `config` options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `networks` | `Partial<Record<Network, NetworkConfig>>` | — | **Required.** Network configuration keyed by network name |
| `gasless` | `boolean` | `false` | Enable ERC-4337 gasless payments via a bundler |
| `secretStore` | `SecretStore` | Keychain (native) | Custom seed phrase storage adapter |
| `confirmationTimeout` | `number` (ms) | `300_000` (5 min) | How long to poll for on-chain receipt before timing out |
| `pollInterval` | `number` (ms) | `3_000` (3 sec) | How often to poll `eth_getTransactionReceipt` |

#### `NetworkConfig` shape

```ts
{
  rpcUrl: string            // JSON-RPC endpoint for this network
  chainId: number           // EIP-155 chain ID
  usdtAddress: string       // USDT ERC-20 contract address on this network

  // ERC-4337 gasless fields — required when gasless: true
  bundlerUrl?: string
  entryPointAddress?: string
  safeModulesVersion?: string
  erc4337?: Record<string, any>  // Extra bundler config (paymasterUrl, isSponsored, etc.)
}
```

---

### `<WDKCheckout>`

The all-in-one drop-in checkout component. Renders the correct UI for every payment state automatically — no state management needed on your side.

**What it renders at each stage:**

| State | UI shown |
|-------|----------|
| First-time user | Wallet setup screen (see `<WDKWalletSetup>`) |
| Returning user | Pay button, unlocks wallet on press |
| Loading / fetching fee | Spinner with status label |
| Fee confirmation | Amount + network fee + Confirm & Cancel buttons |
| Broadcasting / confirming | Spinner |
| Success | "Payment sent!" with txHash |
| Error | Error message + Try again button |

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

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | `string` | Yes | Payment amount as a decimal string — e.g. `"5.00"` |
| `currency` | `"USDT"` | Yes | Currency — currently only USDT is supported |
| `network` | `Network` | Yes | Which network to use — must be in the provider config |
| `recipientAddress` | `string` | Yes | The seller's wallet address that receives the USDT |
| `onSuccess` | `(result: PaymentResult) => void` | Yes | Fired once the transaction is confirmed on-chain |
| `onCancel` | `() => void` | Yes | Fired when the user taps Cancel |
| `onError` | `(error: WDKCheckoutError) => void` | Yes | Fired on any unrecoverable error |

#### `PaymentResult`

```ts
{
  txHash: string    // on-chain transaction hash  e.g. "0xabc123..."
  amount: string    // amount sent  e.g. "5.00"
  network: Network  // which network the transaction was on
  fee: bigint       // gas fee paid in wei
}
```

---

### `<WDKWalletSetup>`

Shown automatically by `<WDKCheckout>` when no wallet exists on the device. You can also use it standalone to build a custom onboarding flow.

```tsx
import { WDKWalletSetup } from 'wdk-checkout'
import { useWDKPayment } from 'wdk-checkout'

function OnboardingScreen() {
  const { createWallet } = useWDKPayment({
    network: 'ethereum',
    recipientAddress: '0x...',
  })

  return (
    <WDKWalletSetup
      createWallet={createWallet}
      onWalletCreated={() => {
        // wallet is ready — navigate to checkout
      }}
      onError={(error) => {
        console.error(error.code, error.message)
      }}
    />
  )
}
```

| Prop | Type | Description |
|------|------|-------------|
| `createWallet` | `() => Promise<void>` | Async function that generates and stores the seed phrase — pass `createWallet` from `useWDKPayment` |
| `onWalletCreated` | `() => void` | Called after the wallet is successfully created |
| `onError` | `(error: WDKCheckoutError) => void` | Called if wallet creation fails |

---

### `useWDKPayment(options)` — build your own UI

Use this hook when you want full control over the UI. It exposes the full payment state machine.

```tsx
import { useWDKPayment } from 'wdk-checkout'

function MyCheckout() {
  const {
    status,          // current PaymentStatus — see table below
    walletAddress,   // buyer's wallet address once initialized
    feeEstimate,     // { fee: bigint, formatted: string } e.g. "0.001234 ETH"
    txHash,          // set after the transaction is broadcast
    error,           // WDKCheckoutError | null
    initiatePayment, // starts the payment flow
    confirmPayment,  // called when user confirms the fee
    cancelPayment,   // resets everything back to idle
    createWallet,    // generates a new wallet for first-time users
  } = useWDKPayment({
    network: 'ethereum',
    recipientAddress: '0xYOUR_ADDRESS',
    gasless: false,  // optional — overrides the provider default
  })

  if (status === 'awaiting_wallet') {
    return (
      <WDKWalletSetup
        createWallet={createWallet}
        onWalletCreated={() => initiatePayment({ amount: '5.00', currency: 'USDT' })}
        onError={(e) => console.error(e)}
      />
    )
  }

  if (status === 'confirming_send' && feeEstimate) {
    return (
      <>
        <Text>Network fee: {feeEstimate.formatted}</Text>
        <Button onPress={confirmPayment} title="Confirm & Pay" />
        <Button onPress={cancelPayment} title="Cancel" />
      </>
    )
  }

  if (status === 'success') {
    return <Text>Paid! {txHash}</Text>
  }

  return (
    <Button
      onPress={() => initiatePayment({ amount: '5.00', currency: 'USDT' })}
      title="Pay 5.00 USDT"
      disabled={status !== 'idle'}
    />
  )
}
```

#### Payment status flow

```
idle
 └─► initiatePayment({ amount, currency })
       └─► initializing        ← unlocking wallet from secure storage
             ├─► awaiting_wallet   ← no wallet found, prompt user to create one
             └─► ready            ← wallet unlocked successfully
                   └─► quoting       ← fetching real-time fee from network
                         └─► confirming_send  ← waiting for user to confirm fee
                               └─► confirmPayment()
                                     └─► broadcasting      ← tx submitted to RPC
                                           └─► confirming_receipt  ← polling for receipt
                                                 ├─► success
                                                 └─► error
```

| Status | What's happening |
|--------|-----------------|
| `idle` | No payment in progress |
| `initializing` | Unlocking the on-device wallet |
| `awaiting_wallet` | No wallet found — user needs to create one first |
| `ready` | Wallet unlocked, fee fetch about to start |
| `quoting` | Fetching real-time fee estimate from the network |
| `confirming_send` | Fee shown — waiting for user to tap Confirm |
| `broadcasting` | Transaction submitted to the RPC node |
| `confirming_receipt` | Polling `eth_getTransactionReceipt` for confirmation |
| `success` | Transaction confirmed on-chain |
| `error` | Unrecoverable error — inspect `error.code` |

---

### `useWDKReceive(options)` — seller side

Use this on the merchant / seller side to display the wallet address for receiving payments, e.g. to show a QR code.

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

Quickly check whether the user already has a wallet set up, without starting a payment flow. Useful for conditional onboarding.

```tsx
import { useWalletState } from 'wdk-checkout'

function HomeScreen() {
  const { exists, isChecking } = useWalletState()

  if (isChecking) return <Spinner />
  if (!exists) return <OnboardingScreen />
  return <DashboardScreen />
}
```

| Return value | Type | Description |
|--------------|------|-------------|
| `exists` | `boolean` | `true` if a seed phrase is stored on this device |
| `isChecking` | `boolean` | `true` while the async storage check is in progress |

---

### `WDKCheckoutError`

Every error thrown by this library is an instance of `WDKCheckoutError`. It extends the native `Error` class and adds a typed `code` property so you can handle specific failure cases cleanly.

```ts
import { WDKCheckoutError } from 'wdk-checkout'

function handleError(error: WDKCheckoutError) {
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      showToast('Not enough USDT in your wallet.')
      break
    case 'BIOMETRIC_CANCELLED':
      showToast('Authentication cancelled. Try again.')
      break
    case 'CONFIRMATION_TIMEOUT':
      showToast('Transaction is taking longer than expected. Check your wallet.')
      break
    default:
      showToast('Payment failed: ' + error.message)
  }
}
```

| Code | When it is thrown |
|------|------------------|
| `WALLET_INIT_FAILED` | Wallet could not be initialized — corrupted seed or network error |
| `BIOMETRIC_CANCELLED` | User dismissed the biometric / PIN prompt |
| `BIOMETRIC_UNAVAILABLE` | Device has no biometrics enrolled or the feature is locked |
| `INSUFFICIENT_BALANCE` | Wallet does not have enough USDT or ETH to cover amount + fee |
| `BROADCAST_FAILED` | RPC rejected the transaction or it reverted on-chain |
| `CONFIRMATION_TIMEOUT` | Transaction receipt not found within `confirmationTimeout` |
| `WEB_STORAGE_REQUIRED` | Running on web with no `secretStore` provided to the provider |
| `NETWORK_UNSUPPORTED` | The requested network is not in the provider config |

---

## Gasless payments (ERC-4337)

Sponsor gas fees for your users by routing transactions through an ERC-4337 bundler with a paymaster. Under the hood this uses Tether's `wdk-wallet-evm-erc-4337`.

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
  gasless: true,  // <-- enables ERC-4337 mode
}
```

> The `erc4337` object is passed directly to the underlying `WalletManagerEvmErc4337` — include any additional fields your bundler requires.

---

## Custom `SecretStore`

By default on React Native, seed phrases are stored via `react-native-keychain` with biometric protection backed by the device's secure enclave. To bring your own storage backend, implement the `SecretStore` interface:

```ts
import type { SecretStore } from 'wdk-checkout'

class MyEncryptedStore implements SecretStore {
  async save(seed: string): Promise<void> {
    // encrypt and persist the seed phrase
  }

  async load(): Promise<string | null> {
    // decrypt and return the seed phrase, or null if not set
  }

  async clear(): Promise<void> {
    // permanently delete the stored seed phrase
  }

  async exists(): Promise<boolean> {
    // return true if a seed phrase is currently stored
  }
}

// Pass it to the provider
<WDKCheckoutProvider config={{ ..., secretStore: new MyEncryptedStore() }}>
```

---

## TypeScript types

All public types are exported from `wdk-checkout`:

```ts
import type {
  Network,              // 'ethereum' | 'polygon' | 'sepolia'
  NetworkConfig,        // rpcUrl, chainId, usdtAddress, ...
  WDKCheckoutConfig,    // full provider config shape
  PaymentParams,        // { amount: string, currency: 'USDT' }
  PaymentResult,        // { txHash, amount, network, fee }
  PaymentStatus,        // all 10 status string literals
  FeeEstimate,          // { fee: bigint, formatted: string }
  WDKCheckoutProps,     // props for <WDKCheckout>
  UseWDKPaymentOptions, // options for useWDKPayment()
  UseWDKReceiveOptions, // options for useWDKReceive()
  SecretStore,          // interface for custom storage adapters
  WDKCheckoutErrorCode, // all 8 error code string literals
} from 'wdk-checkout'
```

---

## Testing

`MemorySecretStore` is exported for use in unit tests and web demos. It stores the seed phrase in memory only — safe for tests, **not for production**.

```ts
import { MemorySecretStore } from 'wdk-checkout'

const store = new MemorySecretStore()
await store.save('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')

const exists = await store.exists() // true
const seed   = await store.load()   // returns the seed phrase
await store.clear()
```

### Integration test (Sepolia testnet)

A full end-to-end integration test is included in the repo. It auto-skips if environment variables are not set, so it never breaks CI:

```bash
INTEGRATION_SEED_PHRASE="your twelve words here" \
INTEGRATION_RECIPIENT="0xRECIPIENT_ADDRESS" \
INTEGRATION_RPC_URL="https://rpc.sepolia.org" \
pnpm test -- --testPathPattern=integration
```

---

## Security

- Seed phrases are stored using `react-native-keychain` with `BIOMETRY_CURRENT_SET` access control and `SECURE_HARDWARE` security level — backed by the device's secure enclave (Keystore on Android, Secure Enclave on iOS)
- The seed phrase is **never transmitted** over any network
- Each transaction requires explicit biometric or PIN confirmation from the user
- `BIOMETRY_CURRENT_SET` means the stored key is invalidated if new biometrics are enrolled — protecting against an attacker adding their own fingerprint

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, running tests, and the project architecture.

---

## License

MIT — built on [Tether WDK](https://github.com/tethertechnology/wdk)
