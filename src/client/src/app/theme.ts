import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#155eef',
    },
    secondary: {
      main: '#0f766e',
    },
    background: {
      default: '#f6f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#5f6b7a',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      letterSpacing: 0,
    },
    h2: {
      letterSpacing: 0,
    },
    h3: {
      letterSpacing: 0,
    },
    h4: {
      letterSpacing: 0,
    },
    h5: {
      letterSpacing: 0,
    },
    h6: {
      letterSpacing: 0,
    },
    button: {
      letterSpacing: 0,
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})
