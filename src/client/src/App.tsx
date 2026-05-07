import { CacheProvider } from '@emotion/react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createEmotionCache } from './app/createEmotionCache'
import { LocalizationProvider } from './app/LocalizationProvider'
import { getTextDirection, type Language } from './app/localization'
import { createAppTheme } from './app/theme'
import { LoginScreen } from './features/auth/LoginScreen'
import { getMillisecondsUntilSessionExpiration, isAuthSession, isSessionExpired } from './features/auth/authSession'
import type { AuthSession } from './features/auth/authTypes'
import { TransactionDashboard } from './features/transactions/TransactionDashboard'
import type { TransactionViewMode } from './features/transactions/transactionViewTypes'
import { AppShell } from './shared/layout/AppShell'

const authStorageKey = 'transactions-manager.auth'
const languageStorageKey = 'transactions-manager.language'
const viewModeStorageKey = 'transactions-manager.viewMode'

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(readStoredSession)
  const [language, setLanguage] = useState<Language>(readStoredLanguage)
  const [viewMode, setViewMode] = useState<TransactionViewMode>(readStoredViewMode)
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

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(authStorageKey)
    setAuthSession(null)
  }, [])

  useEffect(() => {
    if (!authSession) {
      return undefined
    }

    const timeoutId = window.setTimeout(handleLogout, getMillisecondsUntilSessionExpiration(authSession))

    return () => window.clearTimeout(timeoutId)
  }, [authSession, handleLogout])

  function handleLanguageChange(nextLanguage: Language) {
    window.localStorage.setItem(languageStorageKey, nextLanguage)
    setLanguage(nextLanguage)
  }

  function handleViewModeChange(nextViewMode: TransactionViewMode) {
    window.localStorage.setItem(viewModeStorageKey, nextViewMode)
    setViewMode(nextViewMode)
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
            onViewModeChange={handleViewModeChange}
            viewMode={viewMode}
            username={authSession?.username}
          >
            {authSession ? (
              <TransactionDashboard
                accessToken={authSession.accessToken}
                key={authSession.accessToken}
                onUnauthorized={handleLogout}
                viewMode={viewMode}
              />
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
    const session = JSON.parse(storedValue) as unknown

    if (!isAuthSession(session) || isSessionExpired(session)) {
      window.localStorage.removeItem(authStorageKey)
      return null
    }

    return session
  } catch {
    window.localStorage.removeItem(authStorageKey)
    return null
  }
}

function readStoredLanguage(): Language {
  return window.localStorage.getItem(languageStorageKey) === 'he' ? 'he' : 'en'
}

function readStoredViewMode(): TransactionViewMode {
  return window.localStorage.getItem(viewModeStorageKey) === 'detailed' ? 'detailed' : 'focused'
}
