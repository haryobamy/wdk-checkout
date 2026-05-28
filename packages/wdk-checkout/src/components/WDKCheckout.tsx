import React, { useEffect } from 'react'
import { useWDKPayment } from '../hooks/useWDKPayment'
import { WDKWalletSetup } from './WDKWalletSetup'
import type { WDKCheckoutProps } from '../types'

export function WDKCheckout({
  amount,
  currency,
  network,
  recipientAddress,
  onSuccess,
  onCancel,
  onError,
}: WDKCheckoutProps) {
  const {
    status,
    walletAddress,
    feeEstimate,
    txHash,
    error,
    initiatePayment,
    confirmPayment,
    cancelPayment,
    createWallet,
  } = useWDKPayment({ network, recipientAddress })

  // Fire callbacks only once when status changes — never in the render body
  useEffect(() => {
    if (status === 'success' && txHash) {
      onSuccess({ txHash, amount, network, fee: feeEstimate?.fee ?? 0n })
    }
  }, [status, txHash])

  useEffect(() => {
    if (status === 'error' && error) {
      onError(error)
    }
  }, [status, error])

  const container: React.CSSProperties = {
    padding: 32, textAlign: 'center', fontFamily: 'system-ui, sans-serif',
    maxWidth: 400, margin: '0 auto',
  }

  if (status === 'awaiting_wallet') {
    return (
      <WDKWalletSetup
        createWallet={createWallet}
        onWalletCreated={() => initiatePayment({ amount, currency })}
        onError={onError}
      />
    )
  }

  if (status === 'success' && txHash) {
    return (
      <div style={container}>
        <p style={{ color: '#22c55e', fontSize: 20, fontWeight: 700 }}>Payment sent!</p>
        <p style={{ fontSize: 11, color: '#aaa', wordBreak: 'break-all' }}>{txHash}</p>
      </div>
    )
  }

  if (status === 'error' && error) {
    return (
      <div style={container}>
        <p style={{ color: '#ef4444' }}>{error.message}</p>
        <button onClick={cancelPayment} style={btnStyle}>Try again</button>
      </div>
    )
  }

  if (status === 'confirming_send' && feeEstimate) {
    return (
      <div style={container}>
        <h2>Confirm payment</h2>
        <p style={{ fontSize: 32, fontWeight: 800 }}>{amount} {currency}</p>
        <p style={{ color: '#888' }}>Network fee: {feeEstimate.formatted}</p>
        <button onClick={confirmPayment} style={btnStyle}>Confirm &amp; pay</button>
        <button onClick={cancelPayment} style={cancelStyle}>Cancel</button>
      </div>
    )
  }

  const isLoading = ['initializing', 'quoting', 'broadcasting', 'confirming_receipt'].includes(status)

  return (
    <div style={container}>
      <h2>Pay {amount} {currency}</h2>
      {walletAddress && <p style={{ fontSize: 11, color: '#aaa' }}>{walletAddress}</p>}
      {isLoading ? (
        <p style={{ color: '#555' }}>{statusLabel(status)}</p>
      ) : (
        <button onClick={() => initiatePayment({ amount, currency })} style={btnStyle}>
          Pay {amount} {currency}
        </button>
      )}
      <button onClick={onCancel} style={cancelStyle}>Cancel</button>
    </div>
  )
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    initializing: 'Unlocking wallet…',
    quoting: 'Fetching fee…',
    broadcasting: 'Sending transaction…',
    confirming_receipt: 'Waiting for confirmation…',
  }
  return labels[status] ?? ''
}

const btnStyle: React.CSSProperties = {
  background: '#1a1a1a', color: '#fff', border: 'none',
  borderRadius: 12, padding: '14px 40px', fontSize: 16,
  cursor: 'pointer', display: 'block', width: '100%', marginBottom: 12,
}

const cancelStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#888',
  fontSize: 15, cursor: 'pointer', padding: '10px',
}
