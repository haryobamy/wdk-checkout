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

function isInsufficientFunds(err: unknown): boolean {
  const message = ((err as Error)?.message ?? '').toLowerCase()
  const code = (err as { code?: string })?.code ?? ''
  return (
    message.includes('insufficient funds') ||
    message.includes('insufficient balance') ||
    // ethers.js v6 throws CALL_EXCEPTION when estimateGas fails due to no balance
    code === 'CALL_EXCEPTION' ||
    message.includes('call_exception') ||
    message.includes('revert')
  )
}

export class PaymentEngine {
  constructor(private options: PaymentEngineOptions) {}

  async quote(amount: string): Promise<FeeEstimate> {
    const { wallet, usdtAddress, recipientAddress } = this.options
    try {
      const result = await wallet.quoteTransfer({
        token: usdtAddress,
        recipient: recipientAddress,
        amount: parseUSDT(amount),
      })
      return {
        fee: result.fee,
        formatted: formatWei(result.fee),
      }
    } catch (err) {
      if (isInsufficientFunds(err)) {
        throw new WDKCheckoutError(
          'INSUFFICIENT_BALANCE',
          'Insufficient balance — make sure your wallet has enough USDT and ETH for gas.',
        )
      }
      throw new WDKCheckoutError('BROADCAST_FAILED', (err as Error).message ?? String(err))
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
      if (isInsufficientFunds(err)) {
        throw new WDKCheckoutError(
          'INSUFFICIENT_BALANCE',
          'Insufficient balance — make sure your wallet has enough USDT and ETH for gas.',
        )
      }
      throw new WDKCheckoutError('BROADCAST_FAILED', (err as Error).message ?? String(err))
    }
  }
}
