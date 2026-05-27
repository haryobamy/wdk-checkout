import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useWDKPayment } from '../hooks/useWDKPayment'
import { WDKCheckoutProvider } from '../components/WDKCheckoutProvider'
import { MemorySecretStore } from '../testing/MemorySecretStore'

jest.mock('@tetherto/wdk-wallet-evm', () =>
  jest.fn().mockImplementation(() => ({
    getAccount: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockResolvedValue('0xSENDER'),
      quoteTransfer: jest.fn().mockResolvedValue({ fee: 1_000_000_000_000_000n }),
      transfer: jest.fn().mockResolvedValue({ hash: '0xTXHASH', fee: 1_000_000_000_000_000n }),
    }),
    dispose: jest.fn(),
  })),
)

jest.mock('@tetherto/wdk-wallet-evm-erc-4337', () => jest.fn())

jest.mock('../core/TransactionMonitor', () => ({
  TransactionMonitor: jest.fn().mockImplementation(() => ({
    waitForConfirmation: jest.fn().mockResolvedValue({ blockNumber: 100 }),
  })),
}))

const SEED = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

function makeWrapper(store: MemorySecretStore) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WDKCheckoutProvider
        config={{
          networks: {
            sepolia: {
              rpcUrl: 'https://rpc.example.com',
              chainId: 11155111,
              usdtAddress: '0xUSDT',
            },
          },
          secretStore: store,
        }}
      >
        {children}
      </WDKCheckoutProvider>
    )
  }
}

describe('useWDKPayment', () => {
  it('starts in idle state', () => {
    const store = new MemorySecretStore()
    const { result } = renderHook(
      () => useWDKPayment({ network: 'sepolia', recipientAddress: '0xRECIPIENT' }),
      { wrapper: makeWrapper(store) },
    )
    expect(result.current.status).toBe('idle')
  })

  it('transitions to awaiting_wallet when no seed exists', async () => {
    const store = new MemorySecretStore()
    const { result } = renderHook(
      () => useWDKPayment({ network: 'sepolia', recipientAddress: '0xRECIPIENT' }),
      { wrapper: makeWrapper(store) },
    )

    await act(async () => {
      result.current.initiatePayment({ amount: '5.00', currency: 'USDT' })
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(result.current.status).toBe('awaiting_wallet')
  })

  it('transitions through to confirming_send when wallet exists', async () => {
    const store = new MemorySecretStore()
    await store.save(SEED)

    const { result } = renderHook(
      () => useWDKPayment({ network: 'sepolia', recipientAddress: '0xRECIPIENT' }),
      { wrapper: makeWrapper(store) },
    )

    await act(async () => {
      result.current.initiatePayment({ amount: '5.00', currency: 'USDT' })
      await new Promise((r) => setTimeout(r, 100))
    })

    expect(result.current.status).toBe('confirming_send')
    expect(result.current.walletAddress).toBe('0xSENDER')
    expect(result.current.feeEstimate).not.toBeNull()
  })

  it('transitions to success after confirmPayment', async () => {
    const store = new MemorySecretStore()
    await store.save(SEED)

    const { result } = renderHook(
      () => useWDKPayment({ network: 'sepolia', recipientAddress: '0xRECIPIENT' }),
      { wrapper: makeWrapper(store) },
    )

    await act(async () => {
      result.current.initiatePayment({ amount: '5.00', currency: 'USDT' })
      await new Promise((r) => setTimeout(r, 100))
    })

    await act(async () => {
      result.current.confirmPayment()
      await new Promise((r) => setTimeout(r, 100))
    })

    expect(result.current.status).toBe('success')
    expect(result.current.txHash).toBe('0xTXHASH')
  })

  it('resets to idle on cancelPayment', async () => {
    const store = new MemorySecretStore()
    await store.save(SEED)

    const { result } = renderHook(
      () => useWDKPayment({ network: 'sepolia', recipientAddress: '0xRECIPIENT' }),
      { wrapper: makeWrapper(store) },
    )

    await act(async () => {
      result.current.initiatePayment({ amount: '5.00', currency: 'USDT' })
      await new Promise((r) => setTimeout(r, 100))
    })

    act(() => { result.current.cancelPayment() })
    expect(result.current.status).toBe('idle')
  })
})
