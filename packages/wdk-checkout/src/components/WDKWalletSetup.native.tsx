import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
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
    <View style={styles.container}>
      <Text style={styles.title}>Set up your wallet</Text>
      <Text style={styles.subtitle}>
        A self-custodial wallet will be created on this device and secured with biometrics.
        Your seed phrase never leaves your device.
      </Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>Create wallet</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  button: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
