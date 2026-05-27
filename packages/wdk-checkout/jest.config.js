/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src/__tests__'],
  testPathIgnorePatterns: ['/node_modules/', '/src/__tests__/integration/'],
  moduleNameMapper: {
    // Route .native imports to web stubs in test environment
    '^(.*)\\.native$': '$1',
  },
}

module.exports = config
