import React, { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { WDKCheckoutConfig, Network, NetworkConfig } from '../types'
import type { SecretStore } from '../storage/SecretStore'
import defaultSecretStore from '../storage/SecretStore'
import { WDKCheckoutError } from '../core/WDKCheckoutError'

interface CheckoutContextValue {
  getNetworkConfig(network: Network): NetworkConfig
  gasless: boolean
  secretStore: SecretStore
  confirmationTimeout: number
  pollInterval: number
}

export const WDKCheckoutContext = createContext<CheckoutContextValue | null>(null)

export function WDKCheckoutProvider({
  config,
  children,
}: {
  config: WDKCheckoutConfig
  children: ReactNode
}) {
  const value = useMemo<CheckoutContextValue>(
    () => ({
      getNetworkConfig(network: Network): NetworkConfig {
        const cfg = config.networks[network]
        if (!cfg) {
          throw new WDKCheckoutError(
            'NETWORK_UNSUPPORTED',
            `Network "${network}" is not configured in WDKCheckoutProvider`,
          )
        }
        return cfg
      },
      gasless: config.gasless ?? false,
      secretStore: config.secretStore ?? defaultSecretStore,
      confirmationTimeout: config.confirmationTimeout ?? 300_000,
      pollInterval: config.pollInterval ?? 3_000,
    }),
    [config],
  )

  return <WDKCheckoutContext.Provider value={value}>{children}</WDKCheckoutContext.Provider>
}

export function useCheckoutContext(): CheckoutContextValue {
  const ctx = useContext(WDKCheckoutContext)
  if (!ctx) {
    throw new Error('useWDKPayment must be used inside <WDKCheckoutProvider>')
  }
  return ctx
}
