/**
 * parseUSDT converts a decimal string to USDT base units (6 decimals).
 * "5.00" → 5_000_000n
 * "0.50" → 500_000n
 */
export function parseUSDT(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.')
  const paddedFraction = fraction.padEnd(6, '0').slice(0, 6)
  return BigInt(whole) * 1_000_000n + BigInt(paddedFraction || '0')
}

/**
 * formatWei converts a wei bigint to a human-readable ETH string.
 * 1_000_000_000_000_000n → "0.001000 ETH"
 */
export function formatWei(wei: bigint): string {
  const eth = Number(wei) / 1e18
  return `${eth.toFixed(6)} ETH`
}
