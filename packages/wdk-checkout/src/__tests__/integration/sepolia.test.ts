/**
 * Integration test: real Sepolia USDT transfer.
 * Requires env vars:
 *   INTEGRATION_SEED_PHRASE — funded Sepolia test wallet
 *   INTEGRATION_RECIPIENT   — recipient address
 *   INTEGRATION_RPC_URL     — Sepolia RPC URL
 *
 * Skipped automatically when env vars are absent.
 */
import { WalletManager } from '../../core/WalletManager'
import { PaymentEngine } from '../../core/PaymentEngine'
import { TransactionMonitor } from '../../core/TransactionMonitor'
import { MemorySecretStore } from '../../testing/MemorySecretStore'

const SEED = process.env.INTEGRATION_SEED_PHRASE
const RECIPIENT = process.env.INTEGRATION_RECIPIENT
const RPC_URL = process.env.INTEGRATION_RPC_URL

const skip = !SEED || !RECIPIENT || !RPC_URL

;(skip ? describe.skip : describe)('Sepolia integration', () => {
  it('completes a full USDT transfer and confirms receipt', async () => {
    const store = new MemorySecretStore()
    await store.save(SEED!)

    const config = {
      rpcUrl: RPC_URL!,
      chainId: 11155111,
      usdtAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    }

    const manager = new WalletManager({
      network: 'sepolia',
      config,
      gasless: false,
      secretStore: store,
    })

    const wallet = await manager.init()
    console.log('Sender:', wallet.address)

    const engine = new PaymentEngine({
      wallet,
      usdtAddress: config.usdtAddress,
      recipientAddress: RECIPIENT!,
      network: 'sepolia',
    })

    const quote = await engine.quote('0.01')
    console.log('Fee estimate:', quote.formatted)

    const { txHash } = await engine.send('0.01')
    console.log('txHash:', txHash)

    manager.dispose()

    const monitor = new TransactionMonitor()
    const { blockNumber } = await monitor.waitForConfirmation({
      rpcUrl: RPC_URL!,
      txHash,
      pollInterval: 3_000,
      timeout: 120_000,
    })

    console.log('Confirmed at block:', blockNumber)
    expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    expect(blockNumber).toBeGreaterThan(0)
  }, 180_000)
})
