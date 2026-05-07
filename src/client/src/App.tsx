import { CssBaseline, ThemeProvider } from '@mui/material'
import { appTheme } from './app/theme'
import { TransactionDashboard } from './features/transactions/TransactionDashboard'
import { AppShell } from './shared/layout/AppShell'

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppShell>
        <TransactionDashboard />
      </AppShell>
    </ThemeProvider>
  )
}

export default App
