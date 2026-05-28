/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // sodium-universal (used by Tether WDK) tries to load sodium-native,
    // a native C addon unavailable in browser environments.
    // We alias sodium-universal directly to sodium-javascript so webpack
    // bundles the pure JS implementation cleanly, making all sodium_*
    // functions (including sodium_memzero) available in the browser.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'sodium-native': false,
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'sodium-universal': require.resolve('sodium-javascript'),
    }
    return config
  },
}

module.exports = nextConfig
