import { createContext, useContext } from 'react'
import type { LocalizationContextValue } from './localization'

export const LocalizationContext = createContext<LocalizationContextValue | null>(null)

export function useLocalization() {
  const context = useContext(LocalizationContext)

  if (!context) {
    throw new Error('useLocalization must be used inside LocalizationProvider.')
  }

  return context
}
