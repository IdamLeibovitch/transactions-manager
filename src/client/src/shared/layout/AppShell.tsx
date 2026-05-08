import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import CheckIcon from '@mui/icons-material/Check'
import LogoutIcon from '@mui/icons-material/Logout'
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel'
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
} from '@mui/material'
import { useState, type MouseEvent, type ReactNode } from 'react'
import { useLocalization } from '../../app/LocalizationContext'
import type { Language } from '../../app/localization'
import type { TransactionViewMode } from '../../features/transactions/transactionViewTypes'

type AppShellProps = {
  children: ReactNode
  isAuthenticated: boolean
  language: Language
  onLanguageChange: (language: Language) => void
  onLogoutClick: () => void
  onViewModeChange: (viewMode: TransactionViewMode) => void
  viewMode: TransactionViewMode
  username?: string
}

export function AppShell({
  children,
  isAuthenticated,
  language,
  onLanguageChange,
  onLogoutClick,
  onViewModeChange,
  viewMode,
  username,
}: AppShellProps) {
  const { direction, t } = useLocalization()
  const [accountAnchorEl, setAccountAnchorEl] = useState<HTMLElement | null>(null)
  const isAccountMenuOpen = Boolean(accountAnchorEl)
  const accountMenuHorizontalOrigin = direction === 'rtl' ? 'left' : 'right'

  function handleAccountClick(event: MouseEvent<HTMLElement>) {
    setAccountAnchorEl(event.currentTarget)
  }

  function handleAccountClose() {
    setAccountAnchorEl(null)
  }

  function handleLogout() {
    handleAccountClose()
    onLogoutClick()
  }

  function handleViewModeChange(nextViewMode: TransactionViewMode) {
    onViewModeChange(nextViewMode)
    handleAccountClose()
  }

  return (
    <Box sx={{ bgcolor: 'background.default', display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'primary.main',
          borderRadius: 1,
          color: 'primary.main',
          fontWeight: 700,
          insetInlineStart: 16,
          p: 1,
          position: 'fixed',
          top: 8,
          transform: 'translateY(-160%)',
          transition: 'transform 120ms ease',
          zIndex: (theme) => theme.zIndex.tooltip + 1,
          '&:focus': {
            outline: 2,
            outlineColor: 'primary.main',
            outlineOffset: 2,
            transform: 'translateY(0)',
          },
        }}
      >
        {t('common.skipToContent')}
      </Box>
      <AppBar
        color="inherit"
        elevation={0}
        position="sticky"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2, minHeight: { xs: 64, sm: 72 } }}>
          <Box
            alt="Shva"
            component="img"
            src="/shva-logo.png"
            sx={{ display: 'block', height: { xs: 28, sm: 34 }, width: 'auto' }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Stack
              aria-label={t('common.language')}
              component="nav"
              direction="row"
              spacing={0.5}
              sx={{ direction: 'ltr' }}
            >
              <Button
                aria-pressed={language === 'en'}
                onClick={() => onLanguageChange('en')}
                size="small"
                type="button"
                variant={language === 'en' ? 'contained' : 'outlined'}
              >
                EN
              </Button>
              <Button
                aria-pressed={language === 'he'}
                onClick={() => onLanguageChange('he')}
                size="small"
                type="button"
                variant={language === 'he' ? 'contained' : 'outlined'}
              >
                עברית
              </Button>
            </Stack>
            {isAuthenticated ? (
              <>
                <Tooltip title={username ?? t('auth.account')}>
                  <IconButton
                    aria-controls={isAccountMenuOpen ? 'account-menu' : undefined}
                    aria-expanded={isAccountMenuOpen ? 'true' : undefined}
                    aria-haspopup="true"
                    aria-label={t('auth.account')}
                    color="primary"
                    onClick={handleAccountClick}
                  >
                    <AccountCircleIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={accountAnchorEl}
                  anchorOrigin={{
                    horizontal: accountMenuHorizontalOrigin,
                    vertical: 'bottom',
                  }}
                  id="account-menu"
                  onClose={handleAccountClose}
                  open={isAccountMenuOpen}
                  transformOrigin={{
                    horizontal: accountMenuHorizontalOrigin,
                    vertical: 'top',
                  }}
                >
                  <MenuItem disabled>{username}</MenuItem>
                  <MenuItem
                    onClick={() => handleViewModeChange('focused')}
                    selected={viewMode === 'focused'}
                  >
                    <ListItemIcon>
                      {viewMode === 'focused' ? <CheckIcon fontSize="small" /> : <ViewCarouselIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText>{t('view.focused')}</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleViewModeChange('detailed')}
                    selected={viewMode === 'detailed'}
                  >
                    <ListItemIcon>
                      {viewMode === 'detailed' ? <CheckIcon fontSize="small" /> : <ViewCarouselIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText>{t('view.detailed')}</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('auth.logout')}</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            ) : null}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        id="main-content"
        maxWidth="lg"
        tabIndex={-1}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          py: { xs: 3, md: 5 },
        }}
      >
        {children}
      </Container>
    </Box>
  )
}
