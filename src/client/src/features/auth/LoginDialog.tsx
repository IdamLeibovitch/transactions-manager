import LoginIcon from '@mui/icons-material/Login'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import type { AuthSession } from './authTypes'
import { login } from './authApi'

type LoginDialogProps = {
  open: boolean
  onClose: () => void
  onLogin: (session: AuthSession) => void
}

export function LoginDialog({ open, onClose, onLogin }: LoginDialogProps) {
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
      onClose()
    } catch (loginError) {
      setError(loginError instanceof Error ? localizeLoginError(loginError.message, t) : t('auth.loginFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>{t('auth.login')}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="login-form" onSubmit={handleSubmit} spacing={2} sx={{ pt: 1 }}>
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={isSubmitting} onClick={onClose}>
          {t('auth.cancel')}
        </Button>
        <Button
          form="login-form"
          loading={isSubmitting}
          startIcon={<LoginIcon />}
          type="submit"
          variant="contained"
        >
          {t('auth.login')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function localizeLoginError(errorMessage: string, t: (key: 'auth.invalidCredentials' | 'auth.loginFailed') => string) {
  return errorMessage === 'auth.invalidCredentials' ? t('auth.invalidCredentials') : t('auth.loginFailed')
}
