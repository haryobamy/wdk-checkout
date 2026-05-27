import { useState, useEffect } from 'react'
import { useCheckoutContext } from '../components/WDKCheckoutProvider'

interface WalletState {
  exists: boolean
  isChecking: boolean
}

export function useWalletState(): WalletState {
  const ctx = useCheckoutContext()
  const [state, setState] = useState<WalletState>({ exists: false, isChecking: true })

  useEffect(() => {
    ctx.secretStore.exists().then((exists) => {
      setState({ exists, isChecking: false })
    }).catch(() => {
      setState({ exists: false, isChecking: false })
    })
  }, [ctx.secretStore])

  return state
}
