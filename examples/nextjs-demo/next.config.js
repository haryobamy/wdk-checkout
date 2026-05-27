/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // sodium-universal (used by Tether WDK) tries to load sodium-native
    // which is a native C addon unavailable in browser/edge environments.
    // Setting it to false lets sodium-universal fall back to sodium-javascript.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'sodium-native': false,
    }
    return config
  },
}

module.exports = nextConfig
