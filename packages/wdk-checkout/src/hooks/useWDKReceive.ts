import { useState, useEffect, useCallback } from 'react'
import { useCheckoutContext } from '../components/WDKCheckoutProvider'
import { WalletManager } from '../core/WalletManager'
import type { IncomingPayment, UseWDKReceiveOptions, WatchOptions } from '../types'

export function useWDKReceive(options: UseWDKReceiveOptions) {
  const { network, accountIndex = 0 } = options
  const ctx = useCheckoutContext()
  const [address, setAddress] = useState<string | null>(null)
  const [recentPayments, setRecentPayments] = useState<IncomingPayment[]>([])

  useEffect(() => {
    let cancelled = false

    async function resolveAddress() {
      const exists = await ctx.secretStore.exists()
      if (!exists || cancelled) return

      const manager = new WalletManager({
        network,
        config: ctx.getNetworkConfig(network),
        gasless: false,
        secretStore: ctx.secretStore,
        accountIndex,
      })

      try {
        const wallet = await manager.init()
        if (!cancelled) setAddress(wallet.address)
      } finally {
        manager.dispose()
      }
    }

    resolveAddress().catch(() => {})
    return () => { cancelled = true }
  }, [network, accountIndex, ctx])

  const watchForPayment = useCallback(
    (watchOptions: WatchOptions) => {
      const { timeout = ctx.confirmationTimeout } = watchOptions
      const start = Date.now()
      let stopped = false

      async function poll() {
        while (!stopped && Date.now() - start < timeout) {
          // Polling via RPC for ERC-20 Transfer events is complex;
          // this is a minimal implementation.
          // Production apps should use ethers.js event listeners or WDK Indexer.
          await new Promise((r) => setTimeout(r, ctx.pollInterval))
        }
      }

      poll().catch(() => {})
      return () => { stopped = true }
    },
    [ctx],
  )

  return { address, recentPayments, watchForPayment }
}
