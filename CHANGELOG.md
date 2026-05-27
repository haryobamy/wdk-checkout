# Changelog

All notable changes to `wdk-checkout` will be documented here.

This project follows [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

---

## [0.1.0] — 2026-05-27

### Initial release

**Core engine**
- `WalletManager` — WDK wallet lifecycle (init, dispose) with support for both standard EVM and ERC-4337 gasless wallets
- `PaymentEngine` — `quote()` for fee estimation, `send()` for broadcasting USDT transfers
- `TransactionMonitor` — `eth_getTransactionReceipt` polling with configurable interval and timeout
- `WDKCheckoutError` — typed error class with 8 error codes covering all failure scenarios

**React hooks**
- `useWDKPayment` — full 10-state payment state machine (idle → success/error)
- `useWDKReceive` — seller-side wallet address resolution
- `useWalletState` — lightweight check for whether a wallet exists on device

**Components**
- `WDKCheckoutProvider` — React context provider for network config and storage adapter
- `WDKCheckout` — drop-in checkout component (React Native + web variants)
- `WDKWalletSetup` — first-time wallet creation UI (React Native + web variants)

**Storage**
- `SecretStore` interface — swappable storage adapter
- Native implementation using `react-native-keychain` with biometric protection and secure enclave storage
- Web stub that throws `WEB_STORAGE_REQUIRED` with a clear message
- `MemorySecretStore` — in-memory implementation for testing

**Platform support**
- React Native / Expo (iOS + Android)
- Next.js 14 (App Router)
- Web (custom `SecretStore` required)

**Networks**
- Ethereum mainnet (chain ID 1)
- Polygon (chain ID 137)
- Sepolia testnet (chain ID 11155111)

**Build**
- CJS + ESM + TypeScript declaration outputs via `tsup`
- 27 unit tests, all passing
- Sepolia integration test (skipped automatically in CI without env vars)
