import { createTheme } from '@mui/material/styles'
import type { TextDirection } from './localization'

const bodyFontFamily = ['Roboto', 'Arial', 'sans-serif'].join(',')
const titleFontFamily = ['FtMonopol-WEB', 'Roboto', 'Arial', 'sans-serif'].join(',')

export function createAppTheme(direction: TextDirection) {
  return createTheme({
    direction,
    palette: {
      mode: 'light',
      primary: {
        main: '#41247e',
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
      fontFamily: bodyFontFamily,
      h1: {
        fontFamily: titleFontFamily,
        letterSpacing: 0,
      },
      h2: {
        fontFamily: titleFontFamily,
        letterSpacing: 0,
      },
      h3: {
        fontFamily: titleFontFamily,
        letterSpacing: 0,
      },
      h4: {
        fontFamily: titleFontFamily,
        letterSpacing: 0,
      },
      h5: {
        fontFamily: titleFontFamily,
        letterSpacing: 0,
      },
      h6: {
        fontFamily: titleFontFamily,
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
}
