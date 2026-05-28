import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useWDKPayment } from '../hooks/useWDKPayment'
import { WDKWalletSetup } from './WDKWalletSetup.native'
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
      <View style={styles.container}>
        <Text style={styles.successText}>Payment sent!</Text>
        <Text style={styles.hash} numberOfLines={1}>{txHash}</Text>
      </View>
    )
  }

  if (status === 'error' && error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity style={styles.button} onPress={cancelPayment}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (status === 'confirming_send' && feeEstimate) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Confirm payment</Text>
        <Text style={styles.amount}>{amount} {currency}</Text>
        <Text style={styles.fee}>Network fee: {feeEstimate.formatted}</Text>
        <TouchableOpacity style={styles.button} onPress={confirmPayment}>
          <Text style={styles.buttonText}>Confirm & pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={cancelPayment}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isLoading = ['initializing', 'quoting', 'broadcasting', 'confirming_receipt'].includes(status)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay {amount} {currency}</Text>
      {walletAddress ? <Text style={styles.address} numberOfLines={1}>{walletAddress}</Text> : null}
      {isLoading ? (
        <>
          <ActivityIndicator size="large" style={{ marginVertical: 24 }} />
          <Text style={styles.statusText}>{statusLabel(status)}</Text>
        </>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => initiatePayment({ amount, currency })}
        >
          <Text style={styles.buttonText}>Pay {amount} {currency}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
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

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  amount: { fontSize: 32, fontWeight: '800', marginVertical: 12 },
  fee: { fontSize: 13, color: '#888', marginBottom: 24 },
  address: { fontSize: 11, color: '#aaa', marginBottom: 16, maxWidth: 280 },
  statusText: { fontSize: 14, color: '#555', marginTop: 8 },
  button: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48, marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { paddingVertical: 12 },
  cancelText: { color: '#888', fontSize: 15 },
  successText: { fontSize: 24, fontWeight: '700', color: '#22c55e', marginBottom: 8 },
  errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  hash: { fontSize: 11, color: '#aaa', maxWidth: 280 },
})
