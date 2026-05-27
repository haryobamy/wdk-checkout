import type { SecretStore } from '../storage/SecretStore'

/**
 * In-memory SecretStore for testing and web development.
 * NOT secure — do not use in production.
 */
export class MemorySecretStore implements SecretStore {
  private seed: string | null = null

  async save(seed: string): Promise<void> {
    this.seed = seed
  }

  async load(): Promise<string | null> {
    return this.seed
  }

  async clear(): Promise<void> {
    this.seed = null
  }

  async exists(): Promise<boolean> {
    return this.seed !== null
  }
}
