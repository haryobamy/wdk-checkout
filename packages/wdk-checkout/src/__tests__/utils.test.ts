import { parseUSDT, formatWei } from '../utils'

describe('parseUSDT', () => {
  it('converts whole number string', () => {
    expect(parseUSDT('5')).toBe(5_000_000n)
  })

  it('converts decimal string', () => {
    expect(parseUSDT('5.00')).toBe(5_000_000n)
  })

  it('converts fractional USDT', () => {
    expect(parseUSDT('0.50')).toBe(500_000n)
  })

  it('handles 6 decimal places', () => {
    expect(parseUSDT('1.000001')).toBe(1_000_001n)
  })

  it('truncates beyond 6 decimals', () => {
    expect(parseUSDT('1.0000019')).toBe(1_000_001n)
  })
})

describe('formatWei', () => {
  it('formats 1 ETH', () => {
    expect(formatWei(1_000_000_000_000_000_000n)).toBe('1.000000 ETH')
  })

  it('formats fractional ETH', () => {
    expect(formatWei(1_000_000_000_000_000n)).toBe('0.001000 ETH')
  })
})
