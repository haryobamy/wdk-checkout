import { TransactionMonitor } from '../core/TransactionMonitor'
import { WDKCheckoutError } from '../core/WDKCheckoutError'

global.fetch = jest.fn()

function mockReceipt(status: '0x1' | '0x0' | null) {
  return jest.fn().mockResolvedValue({
    json: () => Promise.resolve({ result: status === null ? null : { status, blockNumber: '0xa' } }),
  })
}

describe('TransactionMonitor', () => {
  beforeEach(() => jest.clearAllMocks())

  it('resolves when receipt status is 0x1', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(mockReceipt('0x1'))

    const monitor = new TransactionMonitor()
    const result = await monitor.waitForConfirmation({
      rpcUrl: 'https://rpc.example.com',
      txHash: '0xTXHASH',
      pollInterval: 10,
      timeout: 5_000,
    })

    expect(result.blockNumber).toBe(10)
  })

  it('throws BROADCAST_FAILED when receipt status is 0x0 (reverted)', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(mockReceipt('0x0'))

    const monitor = new TransactionMonitor()
    await expect(
      monitor.waitForConfirmation({
        rpcUrl: 'https://rpc.example.com',
        txHash: '0xTXHASH',
        pollInterval: 10,
        timeout: 5_000,
      }),
    ).rejects.toMatchObject({ code: 'BROADCAST_FAILED' })
  })

  it('throws CONFIRMATION_TIMEOUT when receipt never arrives', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(mockReceipt(null))

    const monitor = new TransactionMonitor()
    await expect(
      monitor.waitForConfirmation({
        rpcUrl: 'https://rpc.example.com',
        txHash: '0xTXHASH',
        pollInterval: 10,
        timeout: 50,
      }),
    ).rejects.toMatchObject({ code: 'CONFIRMATION_TIMEOUT' })
  })
})
