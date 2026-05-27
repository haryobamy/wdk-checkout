import { PaymentEngine } from '../core/PaymentEngine'
import { WDKCheckoutError } from '../core/WDKCheckoutError'
import type { ManagedWallet } from '../core/WalletManager'

function makeMockWallet(overrides: Partial<ManagedWallet> = {}): ManagedWallet {
  return {
    address: '0xSENDER',
    quoteTransfer: jest.fn().mockResolvedValue({ fee: 2_000_000_000_000_000n }),
    transfer: jest.fn().mockResolvedValue({ hash: '0xTXHASH', fee: 2_000_000_000_000_000n }),
    ...overrides,
  }
}

const engineOptions = {
  wallet: makeMockWallet(),
  usdtAddress: '0xUSDT',
  recipientAddress: '0xRECIPIENT',
  network: 'sepolia' as const,
}

describe('PaymentEngine.quote', () => {
  it('returns fee estimate for given amount', async () => {
    const engine = new PaymentEngine(engineOptions)
    const estimate = await engine.quote('5.00')

    expect(estimate.fee).toBe(2_000_000_000_000_000n)
    expect(estimate.formatted).toContain('ETH')
  })

  it('calls quoteTransfer with correct USDT base units', async () => {
    const wallet = makeMockWallet()
    const engine = new PaymentEngine({ ...engineOptions, wallet })
    await engine.quote('5.00')

    expect(wallet.quoteTransfer).toHaveBeenCalledWith({
      token: '0xUSDT',
      recipient: '0xRECIPIENT',
      amount: 5_000_000n,
    })
  })
})

describe('PaymentEngine.send', () => {
  it('returns txHash and fee on success', async () => {
    const engine = new PaymentEngine(engineOptions)
    const result = await engine.send('5.00')

    expect(result.txHash).toBe('0xTXHASH')
    expect(result.fee).toBe(2_000_000_000_000_000n)
  })

  it('throws INSUFFICIENT_BALANCE when wallet signals insufficient funds', async () => {
    const wallet = makeMockWallet({
      transfer: jest.fn().mockRejectedValue(new Error('insufficient funds')),
    })
    const engine = new PaymentEngine({ ...engineOptions, wallet })

    await expect(engine.send('5.00')).rejects.toMatchObject({
      code: 'INSUFFICIENT_BALANCE',
    })
  })

  it('throws BROADCAST_FAILED on other errors', async () => {
    const wallet = makeMockWallet({
      transfer: jest.fn().mockRejectedValue(new Error('rpc error')),
    })
    const engine = new PaymentEngine({ ...engineOptions, wallet })

    await expect(engine.send('5.00')).rejects.toMatchObject({
      code: 'BROADCAST_FAILED',
    })
  })
})
