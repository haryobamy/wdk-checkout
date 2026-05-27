import * as Keychain from 'react-native-keychain'
import { WDKCheckoutError } from '../core/WDKCheckoutError'
import type { SecretStore } from './SecretStore'

const SERVICE = 'wdk-checkout-seed'

const nativeStore: SecretStore = {
  async save(seed: string): Promise<void> {
    try {
      await Keychain.setGenericPassword('wdk-seed', seed, {
        service: SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      })
    } catch (err) {
      throw new WDKCheckoutError('WALLET_INIT_FAILED', `Failed to save seed: ${(err as Error).message}`)
    }
  },

  async load(): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword({
        service: SERVICE,
        authenticationPrompt: { title: 'Authenticate to pay' },
      })
      if (!result) return null
      return result.password
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('cancel') || msg.includes('Cancel')) {
        throw new WDKCheckoutError('BIOMETRIC_CANCELLED', 'Authentication cancelled by user')
      }
      if (msg.includes('not available') || msg.includes('not enrolled')) {
        throw new WDKCheckoutError('BIOMETRIC_UNAVAILABLE', 'Biometric authentication not available')
      }
      throw new WDKCheckoutError('WALLET_INIT_FAILED', `Failed to load seed: ${msg}`)
    }
  },

  async clear(): Promise<void> {
    await Keychain.resetGenericPassword({ service: SERVICE })
  },

  async exists(): Promise<boolean> {
    const result = await Keychain.hasInternetCredentials(SERVICE)
    return !!result
  },
}

export default nativeStore
