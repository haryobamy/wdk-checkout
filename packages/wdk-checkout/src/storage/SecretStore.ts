import { WDKCheckoutError } from '../core/WDKCheckoutError'

export interface SecretStore {
  save(seed: string): Promise<void>
  load(): Promise<string | null>
  clear(): Promise<void>
  exists(): Promise<boolean>
}

/**
 * Default web stub. Throws WEB_STORAGE_REQUIRED to guide the developer
 * to pass a custom secretStore in WDKCheckoutProvider config.
 */
const webStub: SecretStore = {
  async save() {
    throw new WDKCheckoutError(
      'WEB_STORAGE_REQUIRED',
      'wdk-checkout has no default secret store for web. Pass a `secretStore` adapter in WDKCheckoutProvider config.',
    )
  },
  async load() {
    throw new WDKCheckoutError(
      'WEB_STORAGE_REQUIRED',
      'wdk-checkout has no default secret store for web. Pass a `secretStore` adapter in WDKCheckoutProvider config.',
    )
  },
  async clear() {
    throw new WDKCheckoutError(
      'WEB_STORAGE_REQUIRED',
      'wdk-checkout has no default secret store for web. Pass a `secretStore` adapter in WDKCheckoutProvider config.',
    )
  },
  async exists() {
    throw new WDKCheckoutError(
      'WEB_STORAGE_REQUIRED',
      'wdk-checkout has no default secret store for web. Pass a `secretStore` adapter in WDKCheckoutProvider config.',
    )
  },
}

export default webStub
