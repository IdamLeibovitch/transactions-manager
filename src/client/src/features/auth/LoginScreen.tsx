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
import { isUnauthorizedApiError, readApiErrorMessage } from '../../shared/api/apiErrors'
import { useLoginMutation } from '../../shared/api/apiSlice'
import type { AuthSession } from './authTypes'

type LoginScreenProps = {
  onLogin: (session: AuthSession) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t } = useLocalization()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Pass123!')
  const [error, setError] = useState<string | null>(null)
  const [login, { isLoading: isSubmitting }] = useLoginMutation()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const response = await login({ username, password }).unwrap()
      onLogin({ ...response, username })
    } catch (loginError) {
      setError(
        isUnauthorizedApiError(loginError)
          ? t('auth.invalidCredentials')
          : localizeLoginError(readApiErrorMessage(loginError, 'auth.loginFailed'), t),
      )
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
