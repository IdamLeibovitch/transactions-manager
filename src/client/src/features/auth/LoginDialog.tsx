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
import type { AuthSession } from './authTypes'
import { login } from './authApi'

type LoginDialogProps = {
  open: boolean
  onClose: () => void
  onLogin: (session: AuthSession) => void
}

export function LoginDialog({ open, onClose, onLogin }: LoginDialogProps) {
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
      setError(loginError instanceof Error ? loginError.message : 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>Login</DialogTitle>
      <DialogContent>
        <Stack component="form" id="login-form" onSubmit={handleSubmit} spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            autoComplete="username"
            autoFocus
            disabled={isSubmitting}
            fullWidth
            label="Username"
            onChange={(event) => setUsername(event.target.value)}
            value={username}
          />
          <TextField
            autoComplete="current-password"
            disabled={isSubmitting}
            fullWidth
            label="Password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
        <Button
          form="login-form"
          loading={isSubmitting}
          startIcon={<LoginIcon />}
          type="submit"
          variant="contained"
        >
          Login
        </Button>
      </DialogActions>
    </Dialog>
  )
}
