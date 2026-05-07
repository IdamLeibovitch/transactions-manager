import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import LoginIcon from '@mui/icons-material/Login'
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

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="sticky"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <AccountBalanceIcon color="primary" />
          <Typography
            component="h1"
            sx={{ flexGrow: 1, fontSize: { xs: 18, sm: 20 }, fontWeight: 700 }}
          >
            Transaction Approval Simulator
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Notifications">
              <IconButton aria-label="Notifications">
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Language">
              <IconButton aria-label="Language">
                <TranslateIcon />
              </IconButton>
            </Tooltip>
            <Button startIcon={<LoginIcon />} variant="contained">
              Login
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {children}
      </Container>
    </Box>
  )
}
