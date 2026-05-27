import type { ManagedWallet } from './WalletManager'
import type { Network, FeeEstimate, PaymentResult } from '../types'
import { WDKCheckoutError } from './WDKCheckoutError'
import { parseUSDT, formatWei } from '../utils'

export interface PaymentEngineOptions {
  wallet: ManagedWallet
  usdtAddress: string
  recipientAddress: string
  network: Network
}

export class PaymentEngine {
  constructor(private options: PaymentEngineOptions) {}

  async quote(amount: string): Promise<FeeEstimate> {
    const { wallet, usdtAddress, recipientAddress } = this.options
    const result = await wallet.quoteTransfer({
      token: usdtAddress,
      recipient: recipientAddress,
      amount: parseUSDT(amount),
    })
    return {
      fee: result.fee,
      formatted: formatWei(result.fee),
    }
  }

  async send(amount: string): Promise<PaymentResult> {
    const { wallet, usdtAddress, recipientAddress, network } = this.options
    try {
      const result = await wallet.transfer({
        token: usdtAddress,
        recipient: recipientAddress,
        amount: parseUSDT(amount),
      })
      return {
        txHash: result.hash,
        amount,
        network,
        fee: result.fee,
      }
    } catch (err) {
      const message = (err as Error).message ?? ''
      if (message.includes('insufficient funds')) {
        throw new WDKCheckoutError('INSUFFICIENT_BALANCE', message)
      }
      throw new WDKCheckoutError('BROADCAST_FAILED', message)
    }
  }
}
