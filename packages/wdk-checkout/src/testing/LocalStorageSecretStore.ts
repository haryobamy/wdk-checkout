import type { SecretStore } from '../storage/SecretStore'

const DEFAULT_KEY = 'wdk_checkout_seed'

/**
 * localStorage-backed SecretStore for web development and demos.
 * Persists the seed phrase across page refreshes.
 * NOT secure — do not use in production.
 */
export class LocalStorageSecretStore implements SecretStore {
  constructor(private storageKey: string = DEFAULT_KEY) {}

  async save(seed: string): Promise<void> {
    localStorage.setItem(this.storageKey, seed)
  }

  async load(): Promise<string | null> {
    return localStorage.getItem(this.storageKey)
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey)
  }

  async exists(): Promise<boolean> {
    return localStorage.getItem(this.storageKey) !== null
  }
}
