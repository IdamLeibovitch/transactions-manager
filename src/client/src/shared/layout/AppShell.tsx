import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import TranslateIcon from '@mui/icons-material/Translate'
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import type { Language } from '../../app/localization'

type AppShellProps = {
  children: ReactNode
  isAuthenticated: boolean
  language: Language
  onLanguageToggle: () => void
  onLoginClick: () => void
  onLogoutClick: () => void
  username?: string
}

export function AppShell({
  children,
  isAuthenticated,
  language,
  onLanguageToggle,
  onLoginClick,
  onLogoutClick,
  username,
}: AppShellProps) {
  const { t } = useLocalization()

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="sticky"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Box
            alt="Shva"
            component="img"
            src="/shva-logo.png"
            sx={{ display: 'block', height: { xs: 28, sm: 34 }, width: 'auto' }}
          />
          <Typography
            component="h1"
            sx={{ flexGrow: 1, fontSize: { xs: 18, sm: 20 }, fontWeight: 700 }}
          >
            {t('app.title')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title={t('common.notifications')}>
              <IconButton aria-label={t('common.notifications')}>
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
            <Button onClick={onLanguageToggle} startIcon={<TranslateIcon />} variant="text">
              {language === 'en' ? 'עברית' : 'English'}
            </Button>
            {isAuthenticated ? (
              <Button onClick={onLogoutClick} startIcon={<LogoutIcon />} variant="outlined">
                {username ?? t('auth.logout')}
              </Button>
            ) : (
              <Button onClick={onLoginClick} startIcon={<LoginIcon />} variant="contained">
                {t('auth.login')}
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {children}
      </Container>
    </Box>
  )
}
