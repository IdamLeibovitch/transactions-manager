import type { ReactNode } from 'react'
import { LocalizationContext } from './LocalizationContext'
import {
  getTextDirection,
  languageLocale,
  translations,
  type Language,
} from './localization'

type LocalizationProviderProps = {
  children: ReactNode
  language: Language
}

export function LocalizationProvider({ children, language }: LocalizationProviderProps) {
  const direction = getTextDirection(language)

  return (
    <LocalizationContext.Provider
      value={{
        direction,
        language,
        locale: languageLocale[language],
        t: (key) => translations[language][key],
      }}
    >
      {children}
    </LocalizationContext.Provider>
  )
}
