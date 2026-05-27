'use client'
import { WDKCheckout } from 'wdk-checkout'

export default function StorePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 480, width: '100%', padding: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Demo Store</h1>
        <p style={{ color: '#555', marginBottom: 32 }}>Pay with USDT — self-custodial, no third parties.</p>
        <WDKCheckout
          amount="5.00"
          currency="USDT"
          network="sepolia"
          recipientAddress="0xYOUR_SELLER_ADDRESS"
          onSuccess={(result) => alert(`Payment confirmed: ${result.txHash}`)}
          onCancel={() => alert('Cancelled')}
          onError={(err) => alert(`Error: ${err.message}`)}
        />
      </div>
    </main>
  )
}
