'use client'
import { WDKCheckoutProvider, MemorySecretStore } from 'wdk-checkout'
import { useMemo } from 'react'

// On web, use MemorySecretStore (not for production — demo only)
export function Providers({ children }: { children: React.ReactNode }) {
  const secretStore = useMemo(() => new MemorySecretStore(), [])

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
