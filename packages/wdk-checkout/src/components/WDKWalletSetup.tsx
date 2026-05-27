import React, { useState } from 'react'
import { WDKCheckoutError } from '../core/WDKCheckoutError'

interface Props {
  onWalletCreated: () => void
  onError: (err: WDKCheckoutError) => void
  createWallet: () => Promise<void>
}

export function WDKWalletSetup({ onWalletCreated, onError, createWallet }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      await createWallet()
      onWalletCreated()
    } catch (err) {
      onError(
        err instanceof WDKCheckoutError
          ? err
          : new WDKCheckoutError('WALLET_INIT_FAILED', (err as Error).message),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h2 style={{ marginBottom: 12 }}>Set up your wallet</h2>
      <p style={{ color: '#555', marginBottom: 32 }}>
        A self-custodial wallet will be created and secured. Your seed phrase never leaves this device.
      </p>
      <button
        onClick={handleCreate}
        disabled={loading}
        style={{
          background: '#1a1a1a', color: '#fff', border: 'none',
          borderRadius: 12, padding: '14px 40px', fontSize: 16,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Creating…' : 'Create wallet'}
      </button>
    </div>
  )
}
