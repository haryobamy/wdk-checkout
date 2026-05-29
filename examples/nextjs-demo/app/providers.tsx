'use client'
import { WDKCheckoutProvider, LocalStorageSecretStore } from 'wdk-checkout'
import { useMemo } from 'react'

// LocalStorageSecretStore persists the seed across page refreshes (demo only — not for production)
export function Providers({ children }: { children: React.ReactNode }) {
  const secretStore = useMemo(() => new LocalStorageSecretStore(), [])

  return (
    <WDKCheckoutProvider
      config={{
        networks: {
          sepolia: {
            rpcUrl: 'https://rpc.sepolia.org',
            chainId: 11155111,
            usdtAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          },
        },
        secretStore,
      }}
    >
      {children}
    </WDKCheckoutProvider>
  )
}
