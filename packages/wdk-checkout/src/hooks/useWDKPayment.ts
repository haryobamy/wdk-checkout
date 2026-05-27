import { useReducer, useCallback, useRef } from 'react'
import { useCheckoutContext } from '../components/WDKCheckoutProvider'
import { WalletManager } from '../core/WalletManager'
import type { ManagedWallet } from '../core/WalletManager'
import { PaymentEngine } from '../core/PaymentEngine'
import { TransactionMonitor } from '../core/TransactionMonitor'
import { WDKCheckoutError } from '../core/WDKCheckoutError'
import type {
  PaymentStatus,
  FeeEstimate,
  PaymentParams,
  UseWDKPaymentOptions,
} from '../types'

interface State {
  status: PaymentStatus
  walletAddress: string | null
  feeEstimate: FeeEstimate | null
  txHash: string | null
  error: WDKCheckoutError | null
  _pendingAmount: string | null
}

type Action =
  | { type: 'INIT_START' }
  | { type: 'WALLET_NOT_FOUND' }
  | { type: 'WALLET_READY'; address: string }
  | { type: 'QUOTE_START' }
  | { type: 'QUOTE_DONE'; feeEstimate: FeeEstimate; amount: string }
  | { type: 'BROADCAST_START' }
  | { type: 'BROADCAST_DONE'; txHash: string }
  | { type: 'RECEIPT_CONFIRMED' }
  | { type: 'ERROR'; error: WDKCheckoutError }
  | { type: 'CANCEL' }

const initial: State = {
  status: 'idle',
  walletAddress: null,
  feeEstimate: null,
  txHash: null,
  error: null,
  _pendingAmount: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT_START':
      return { ...initial, status: 'initializing' }
    case 'WALLET_NOT_FOUND':
      return { ...state, status: 'awaiting_wallet' }
    case 'WALLET_READY':
      return { ...state, status: 'ready', walletAddress: action.address }
    case 'QUOTE_START':
      return { ...state, status: 'quoting' }
    case 'QUOTE_DONE':
      return { ...state, status: 'confirming_send', feeEstimate: action.feeEstimate, _pendingAmount: action.amount }
    case 'BROADCAST_START':
      return { ...state, status: 'broadcasting' }
    case 'BROADCAST_DONE':
      return { ...state, status: 'confirming_receipt', txHash: action.txHash }
    case 'RECEIPT_CONFIRMED':
      return { ...state, status: 'success' }
    case 'ERROR':
      return { ...state, status: 'error', error: action.error }
    case 'CANCEL':
      return { ...initial }
    default:
      return state
  }
}

export function useWDKPayment(options: UseWDKPaymentOptions) {
  const { network, recipientAddress, gasless } = options
  const ctx = useCheckoutContext()
  const [state, dispatch] = useReducer(reducer, initial)

  const walletManagerRef = useRef<WalletManager | null>(null)
  const managedWalletRef = useRef<ManagedWallet | null>(null)
  const paymentEngineRef = useRef<PaymentEngine | null>(null)

  const initiatePayment = useCallback(
    async (params: PaymentParams) => {
      dispatch({ type: 'INIT_START' })

      try {
        const exists = await ctx.secretStore.exists()
        if (!exists) {
          dispatch({ type: 'WALLET_NOT_FOUND' })
          return
        }

        const networkConfig = ctx.getNetworkConfig(network)
        const manager = new WalletManager({
          network,
          config: networkConfig,
          gasless: gasless ?? ctx.gasless,
          secretStore: ctx.secretStore,
        })
        walletManagerRef.current = manager

        const wallet = await manager.init()
        managedWalletRef.current = wallet
        dispatch({ type: 'WALLET_READY', address: wallet.address })

        const engine = new PaymentEngine({
          wallet,
          usdtAddress: networkConfig.usdtAddress,
          recipientAddress,
          network,
        })
        paymentEngineRef.current = engine

        dispatch({ type: 'QUOTE_START' })
        const feeEstimate = await engine.quote(params.amount)
        dispatch({ type: 'QUOTE_DONE', feeEstimate, amount: params.amount })
      } catch (err) {
        walletManagerRef.current?.dispose()
        dispatch({
          type: 'ERROR',
          error:
            err instanceof WDKCheckoutError
              ? err
              : new WDKCheckoutError('WALLET_INIT_FAILED', (err as Error).message),
        })
      }
    },
    [network, recipientAddress, gasless, ctx],
  )

  const confirmPayment = useCallback(async () => {
    const engine = paymentEngineRef.current
    const amount = state._pendingAmount
    if (!engine || !amount) return

    dispatch({ type: 'BROADCAST_START' })
    try {
      const { txHash } = await engine.send(amount)
      walletManagerRef.current?.dispose()

      dispatch({ type: 'BROADCAST_DONE', txHash })

      const networkConfig = ctx.getNetworkConfig(network)
      const monitor = new TransactionMonitor()
      await monitor.waitForConfirmation({
        rpcUrl: networkConfig.rpcUrl,
        txHash,
        pollInterval: ctx.pollInterval,
        timeout: ctx.confirmationTimeout,
      })

      dispatch({ type: 'RECEIPT_CONFIRMED' })
    } catch (err) {
      walletManagerRef.current?.dispose()
      dispatch({
        type: 'ERROR',
        error:
          err instanceof WDKCheckoutError
            ? err
            : new WDKCheckoutError('BROADCAST_FAILED', (err as Error).message),
      })
    }
  }, [state._pendingAmount, network, ctx])

  const createWallet = useCallback(async () => {
    try {
      const WDK = (await import('@tetherto/wdk')).default
      const seedPhrase = WDK.getRandomSeedPhrase()
      await ctx.secretStore.save(seedPhrase)
      dispatch({ type: 'INIT_START' })
      const networkConfig = ctx.getNetworkConfig(network)
      const manager = new WalletManager({
        network,
        config: networkConfig,
        gasless: gasless ?? ctx.gasless,
        secretStore: ctx.secretStore,
      })
      walletManagerRef.current = manager
      const wallet = await manager.init()
      managedWalletRef.current = wallet
      dispatch({ type: 'WALLET_READY', address: wallet.address })
    } catch (err) {
      dispatch({
        type: 'ERROR',
        error: new WDKCheckoutError('WALLET_INIT_FAILED', (err as Error).message),
      })
    }
  }, [network, gasless, ctx])

  const cancelPayment = useCallback(() => {
    walletManagerRef.current?.dispose()
    dispatch({ type: 'CANCEL' })
  }, [])

  return {
    status: state.status,
    walletAddress: state.walletAddress,
    feeEstimate: state.feeEstimate,
    txHash: state.txHash,
    error: state.error,
    initiatePayment,
    confirmPayment,
    cancelPayment,
    createWallet,
  }
}
