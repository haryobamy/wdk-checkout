import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import type { Network, NetworkConfig } from '../types'
import type { SecretStore } from '../storage/SecretStore'
import { WDKCheckoutError } from './WDKCheckoutError'

export interface RawTransferParams {
  token: string
  recipient: string
  amount: bigint
}

export interface ManagedWallet {
  address: string
  quoteTransfer(params: RawTransferParams): Promise<{ fee: bigint }>
  transfer(params: RawTransferParams): Promise<{ hash: string; fee: bigint }>
}

export interface WalletManagerOptions {
  network: Network
  config: NetworkConfig
  gasless: boolean
  secretStore: SecretStore
  accountIndex?: number
}

export class WalletManager {
  private walletInstance: { dispose(): void } | null = null

  constructor(private options: WalletManagerOptions) {}

  async init(): Promise<ManagedWallet> {
    const seed = await this.options.secretStore.load()
    if (!seed) {
      throw new WDKCheckoutError('WALLET_INIT_FAILED', 'No seed phrase found in secure storage')
    }

    const { config, gasless, accountIndex = 0 } = this.options

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let walletInst: any

      if (gasless && config.bundlerUrl && config.entryPointAddress) {
        walletInst = new WalletManagerEvmErc4337(seed, {
          chainId: config.chainId,
          provider: config.rpcUrl,
          bundlerUrl: config.bundlerUrl,
          entryPointAddress: config.entryPointAddress,
          safeModulesVersion: config.safeModulesVersion ?? '0.3.0',
          ...config.erc4337,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      } else {
        walletInst = new WalletManagerEvm(seed, {
          provider: config.rpcUrl,
          transferMaxFee: config.transferMaxFeeWei ?? 10_000_000_000_000_000n,
        })
      }

      this.walletInstance = walletInst
      const account = await walletInst.getAccount(accountIndex)
      const address = await account.getAddress()

      return {
        address,
        quoteTransfer: (params: RawTransferParams) => account.quoteTransfer(params),
        transfer: (params: RawTransferParams) => account.transfer(params),
      }
    } catch (err) {
      this.dispose()
      if (err instanceof WDKCheckoutError) throw err
      throw new WDKCheckoutError('WALLET_INIT_FAILED', (err as Error).message)
    }
  }

  dispose(): void {
    if (this.walletInstance) {
      this.walletInstance.dispose()
      this.walletInstance = null
    }
  }
}
