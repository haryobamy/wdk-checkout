import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useWDKReceive } from '../hooks/useWDKReceive'
import { WDKCheckoutProvider } from '../components/WDKCheckoutProvider'
import { MemorySecretStore } from '../testing/MemorySecretStore'

jest.mock('@tetherto/wdk-wallet-evm', () =>
  jest.fn().mockImplementation(() => ({
    getAccount: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockResolvedValue('0xSELLER'),
    }),
    dispose: jest.fn(),
  })),
)

jest.mock('@tetherto/wdk-wallet-evm-erc-4337', () => jest.fn())

const SEED = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

function makeWrapper(store: MemorySecretStore) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WDKCheckoutProvider
        config={{
          networks: {
            sepolia: { rpcUrl: 'https://rpc.example.com', chainId: 11155111, usdtAddress: '0xUSDT' },
          },
          secretStore: store,
        }}
      >
        {children}
      </WDKCheckoutProvider>
    )
  }
}

describe('useWDKReceive', () => {
  it('starts with null address', () => {
    const store = new MemorySecretStore()
    const { result } = renderHook(
      () => useWDKReceive({ network: 'sepolia' }),
      { wrapper: makeWrapper(store) },
    )
    expect(result.current.address).toBeNull()
  })

  it('resolves seller address when seed exists', async () => {
    const store = new MemorySecretStore()
    await store.save(SEED)

    const { result } = renderHook(
      () => useWDKReceive({ network: 'sepolia' }),
      { wrapper: makeWrapper(store) },
    )

    await act(async () => { await new Promise((r) => setTimeout(r, 100)) })
    expect(result.current.address).toBe('0xSELLER')
  })
})
