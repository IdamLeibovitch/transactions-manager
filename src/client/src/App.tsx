import { CacheProvider } from '@emotion/react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { createEmotionCache } from './app/createEmotionCache'
import { LocalizationProvider } from './app/LocalizationProvider'
import { getTextDirection, type Language } from './app/localization'
import { createAppTheme } from './app/theme'
import { LoginScreen } from './features/auth/LoginScreen'
import type { AuthSession } from './features/auth/authTypes'
import { TransactionDashboard } from './features/transactions/TransactionDashboard'
import { AppShell } from './shared/layout/AppShell'

const authStorageKey = 'transactions-manager.auth'
const languageStorageKey = 'transactions-manager.language'

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(readStoredSession)
  const [language, setLanguage] = useState<Language>(readStoredLanguage)
  const direction = getTextDirection(language)
  const emotionCache = useMemo(() => createEmotionCache(direction), [direction])
  const theme = useMemo(() => createAppTheme(direction), [direction])

  useEffect(() => {
    document.documentElement.dir = direction
    document.documentElement.lang = language
    document.title = language === 'he' ? 'סימולטור אישור עסקאות' : 'Transaction Approval Simulator'
  }, [direction, language])

  function handleLogin(session: AuthSession) {
    window.localStorage.setItem(authStorageKey, JSON.stringify(session))
    setAuthSession(session)
  }

  function handleLogout() {
    window.localStorage.removeItem(authStorageKey)
    setAuthSession(null)
  }

  function handleLanguageChange(nextLanguage: Language) {
    window.localStorage.setItem(languageStorageKey, nextLanguage)
    setLanguage(nextLanguage)
  }

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider language={language}>
          <CssBaseline />
          <AppShell
            isAuthenticated={Boolean(authSession)}
            language={language}
            onLanguageChange={handleLanguageChange}
            onLogoutClick={handleLogout}
            username={authSession?.username}
          >
            {authSession ? (
              <TransactionDashboard accessToken={authSession.accessToken} key={authSession.accessToken} />
            ) : (
              <LoginScreen onLogin={handleLogin} />
            )}
          </AppShell>
        </LocalizationProvider>
      </ThemeProvider>
    </CacheProvider>
  )
}

export default App

function readStoredSession() {
  const storedValue = window.localStorage.getItem(authStorageKey)

  if (!storedValue) {
    return null
  }

  try {
    return JSON.parse(storedValue) as AuthSession
  } catch {
    window.localStorage.removeItem(authStorageKey)
    return null
  }
}

function readStoredLanguage(): Language {
  return window.localStorage.getItem(languageStorageKey) === 'he' ? 'he' : 'en'
}
