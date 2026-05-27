# Contributing to wdk-checkout

Thank you for your interest in contributing! This guide covers everything you need to get the project running locally, submit a bug report, or open a pull request.

---

## Table of contents

- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Running tests](#running-tests)
- [Building the package](#building-the-package)
- [Submitting a pull request](#submitting-a-pull-request)
- [Reporting bugs](#reporting-bugs)
- [Coding standards](#coding-standards)

---

## Project structure

```
wdk-checkout/
├── packages/
│   └── wdk-checkout/          # The npm package
│       ├── src/
│       │   ├── core/          # WalletManager, PaymentEngine, TransactionMonitor, WDKCheckoutError
│       │   ├── hooks/         # useWDKPayment, useWDKReceive, useWalletState
│       │   ├── components/    # WDKCheckout, WDKWalletSetup, WDKCheckoutProvider
│       │   ├── storage/       # SecretStore interface + native/web implementations
│       │   ├── testing/       # MemorySecretStore (for tests)
│       │   ├── types/         # All shared TypeScript types
│       │   └── utils/         # parseUSDT, formatWei
│       ├── dist/              # Build output (gitignored)
│       ├── jest.config.js
│       ├── tsconfig.json
│       └── tsup.config.ts
├── examples/
│   ├── expo-demo/             # Expo React Native demo app
│   └── nextjs-demo/           # Next.js 14 demo app
├── package.json               # pnpm workspace root
└── turbo.json                 # Turborepo pipeline
```

**Platform split pattern:** Files ending in `.native.tsx` are picked up by Metro (React Native). Files ending in `.tsx` (without `.native`) are picked up by web bundlers. This is how the package serves different implementations per platform from the same import path.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | `>=18` |
| pnpm | `>=9` |
| TypeScript | `>=5.4` (installed as devDependency) |

Install pnpm if you don't have it:

```bash
npm install -g pnpm@9
```

---

## Local setup

```bash
# 1. Clone the repo
git clone https://github.com/haryobamy/wdk-checkout.git
cd wdk-checkout

# 2. Install all dependencies (workspaces are linked automatically)
pnpm install

# 3. Build the package
cd packages/wdk-checkout
pnpm build
```

---

## Running tests

All tests live in `packages/wdk-checkout/src/__tests__/`.

```bash
cd packages/wdk-checkout

# Run all unit tests
pnpm test

# Run a specific test file
pnpm test -- --testPathPattern=PaymentEngine

# Watch mode
pnpm test -- --watch
```

### Integration test (Sepolia)

The integration test sends a real USDT transaction on Sepolia testnet. It is automatically skipped in CI when env vars are absent.

```bash
INTEGRATION_SEED_PHRASE="your twelve words here" \
INTEGRATION_RECIPIENT="0xRECIPIENT_ADDRESS" \
INTEGRATION_RPC_URL="https://rpc.sepolia.org" \
pnpm test -- --testPathPattern=integration
```

You will need a Sepolia-funded test wallet with SepoliaETH (for gas) and Sepolia USDT (`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`).

---

## Building the package

```bash
cd packages/wdk-checkout
pnpm build
```

This runs `tsup` and produces three outputs in `dist/`:

| File | Format | Use |
|------|--------|-----|
| `dist/index.js` | CommonJS | Node.js / bundlers that require CJS |
| `dist/index.mjs` | ESM | Modern bundlers (Vite, Next.js, Metro) |
| `dist/index.d.ts` | TypeScript declarations | Editor intellisense |

---

## Submitting a pull request

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes.** Keep each PR focused on a single concern.

3. **Add or update tests.** Every new behaviour or bug fix should have a test.

4. **Run the full test suite** and make sure everything passes:
   ```bash
   cd packages/wdk-checkout && pnpm test
   ```

5. **Build the package** to confirm there are no type errors:
   ```bash
   pnpm build
   ```

6. **Commit** with a clear message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add Polygon support to TransactionMonitor
   fix: handle empty seed phrase in WalletManager
   docs: add gasless example to README
   ```

7. **Open a pull request** against the `main` branch with a description of what you changed and why.

---

## Reporting bugs

Please open a [GitHub issue](https://github.com/haryobamy/wdk-checkout/issues) and include:

- `wdk-checkout` version
- Platform (React Native / Expo / Next.js / browser)
- Operating system and device
- Minimal reproduction steps
- The full error message and `error.code` if applicable

---

## Coding standards

- **TypeScript strict mode** is enabled — no implicit `any`
- **No default exports** from library files — named exports only
- **Platform splits** use `.native.ts` / `.tsx` file pairs — never use `Platform.OS` checks inside shared core files
- **Errors** must be thrown as `WDKCheckoutError` with a typed `code` — never throw plain `Error` from library code
- **USDT amounts** are always handled as `bigint` internally (6 decimal places) — use `parseUSDT()` and `formatWei()` from `src/utils`
- **Tests** use `MemorySecretStore` and mock the WDK modules — never hit a real RPC in unit tests
