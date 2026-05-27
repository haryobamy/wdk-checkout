import { WalletManager } from '../core/WalletManager'
import { MemorySecretStore } from '../testing/MemorySecretStore'

jest.mock('@tetherto/wdk-wallet-evm', () => {
  return jest.fn().mockImplementation(() => ({
    getAccount: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockResolvedValue('0xSENDER'),
      quoteTransfer: jest.fn().mockResolvedValue({ fee: 1_000_000_000_000_000n }),
      transfer: jest.fn().mockResolvedValue({ hash: '0xTXHASH', fee: 1_000_000_000_000_000n }),
    }),
    dispose: jest.fn(),
  }))
})

jest.mock('@tetherto/wdk-wallet-evm-erc-4337', () => jest.fn())

const mockNetworkConfig = {
  rpcUrl: 'https://rpc.example.com',
  chainId: 11155111,
  usdtAddress: '0xUSDT',
}

const SEED = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe('WalletManager', () => {
  it('throws WALLET_INIT_FAILED when no seed in store', async () => {
    const store = new MemorySecretStore()
    const manager = new WalletManager({
      network: 'sepolia',
      config: mockNetworkConfig,
      gasless: false,
      secretStore: store,
    })

    await expect(manager.init()).rejects.toMatchObject({
      code: 'WALLET_INIT_FAILED',
    })
  })

  it('returns managed wallet with address when seed exists', async () => {
    const store = new MemorySecretStore()
    await store.save(SEED)

    const manager = new WalletManager({
      network: 'sepolia',
      config: mockNetworkConfig,
      gasless: false,
      secretStore: store,
    })

    const wallet = await manager.init()
    expect(wallet.address).toBe('0xSENDER')
  })

  it('disposes cleanly', async () => {
    const store = new MemorySecretStore()
    await store.save(SEED)

    const manager = new WalletManager({
      network: 'sepolia',
      config: mockNetworkConfig,
      gasless: false,
      secretStore: store,
    })

    await manager.init()
    expect(() => manager.dispose()).not.toThrow()
  })
})
