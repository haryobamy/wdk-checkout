import { WDKCheckoutError } from './WDKCheckoutError'

export interface MonitorOptions {
  rpcUrl: string
  txHash: string
  pollInterval?: number
  timeout?: number
}

export class TransactionMonitor {
  async waitForConfirmation(options: MonitorOptions): Promise<{ blockNumber: number }> {
    const { rpcUrl, txHash, pollInterval = 3_000, timeout = 300_000 } = options
    const deadline = Date.now() + timeout

    while (Date.now() < deadline) {
      const receipt = await this.getReceipt(rpcUrl, txHash)

      if (receipt?.status === '0x1') {
        return { blockNumber: parseInt(receipt.blockNumber, 16) }
      }

      if (receipt?.status === '0x0') {
        throw new WDKCheckoutError('BROADCAST_FAILED', 'Transaction reverted on-chain')
      }

      await sleep(pollInterval)
    }

    throw new WDKCheckoutError(
      'CONFIRMATION_TIMEOUT',
      `Transaction not confirmed within ${timeout}ms`,
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getReceipt(rpcUrl: string, txHash: string): Promise<any> {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    })
    const data = await response.json()
    return data.result
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
