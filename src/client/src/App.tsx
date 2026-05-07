import { CssBaseline, ThemeProvider } from '@mui/material'
import { useState } from 'react'
import { appTheme } from './app/theme'
import { LoginDialog } from './features/auth/LoginDialog'
import type { AuthSession } from './features/auth/authTypes'
import { TransactionDashboard } from './features/transactions/TransactionDashboard'
import { AppShell } from './shared/layout/AppShell'

const authStorageKey = 'transactions-manager.auth'

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(readStoredSession)
  const [isLoginOpen, setIsLoginOpen] = useState(!authSession)

  function handleLogin(session: AuthSession) {
    window.localStorage.setItem(authStorageKey, JSON.stringify(session))
    setAuthSession(session)
  }

  function handleLogout() {
    window.localStorage.removeItem(authStorageKey)
    setAuthSession(null)
    setIsLoginOpen(true)
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppShell
        isAuthenticated={Boolean(authSession)}
        onLoginClick={() => setIsLoginOpen(true)}
        onLogoutClick={handleLogout}
        username={authSession?.username}
      >
        <TransactionDashboard
          accessToken={authSession?.accessToken ?? null}
          key={authSession?.accessToken ?? 'anonymous'}
        />
      </AppShell>
      <LoginDialog
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
        open={isLoginOpen}
      />
    </ThemeProvider>
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
