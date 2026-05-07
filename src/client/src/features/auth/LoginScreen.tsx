import LoginIcon from '@mui/icons-material/Login'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import type { AuthSession } from './authTypes'
import { login } from './authApi'

type LoginScreenProps = {
  onLogin: (session: AuthSession) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t } = useLocalization()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Pass123!')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await login({ username, password })
      onLogin({ ...response, username })
    } catch (loginError) {
      setError(loginError instanceof Error ? localizeLoginError(loginError.message, t) : t('auth.loginFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'grid',
        minHeight: { xs: 'calc(100svh - 128px)', md: 'calc(100svh - 160px)' },
      }}
    >
      <Paper
        component="section"
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          justifySelf: 'center',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          width: '100%',
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography component="h1" sx={{ fontWeight: 700 }} variant="h4">
              {t('auth.screenTitle')}
            </Typography>
            <Typography color="text.secondary">
              {t('auth.screenSubtitle')}
            </Typography>
          </Stack>

          <Stack component="form" onSubmit={handleSubmit} spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              autoComplete="username"
              autoFocus
              disabled={isSubmitting}
              fullWidth
              label={t('auth.username')}
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
            <TextField
              autoComplete="current-password"
              disabled={isSubmitting}
              fullWidth
              label={t('auth.password')}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
            <Button
              loading={isSubmitting}
              size="large"
              startIcon={<LoginIcon />}
              type="submit"
              variant="contained"
            >
              {t('auth.login')}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}

function localizeLoginError(errorMessage: string, t: (key: 'auth.invalidCredentials' | 'auth.loginFailed') => string) {
  return errorMessage === 'auth.invalidCredentials' ? t('auth.invalidCredentials') : t('auth.loginFailed')
}
