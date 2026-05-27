import React from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { WDKCheckoutProvider, WDKCheckout } from 'wdk-checkout'

const config = {
  networks: {
    sepolia: {
      rpcUrl: 'https://rpc.sepolia.org',
      chainId: 11155111,
      usdtAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDT
    },
  },
}

export default function App() {
  return (
    <WDKCheckoutProvider config={config}>
      <SafeAreaView style={styles.container}>
        <WDKCheckout
          amount="1.00"
          currency="USDT"
          network="sepolia"
          recipientAddress="0xYOUR_SELLER_ADDRESS"
          onSuccess={(result) => console.log('Paid!', result.txHash)}
          onCancel={() => console.log('Cancelled')}
          onError={(err) => console.error(err.code, err.message)}
        />
      </SafeAreaView>
    </WDKCheckoutProvider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
})
