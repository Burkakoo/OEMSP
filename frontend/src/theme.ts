import { createTheme } from '@mui/material/styles';

// Create a custom Material-UI theme for OICT TUTOR
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4338CA',
    },
    secondary: {
      main: '#A855F7',
      light: '#C084FC',
      dark: '#7E22CE',
    },
    error: {
      main: '#F43F5E',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#06B6D4',
    },
    success: {
      main: '#10B981',
    },
    background: {
      default: '#0B0F19',
      paper: '#111827',
    },
  },
  typography: {
    fontFamily: [
      '"Plus Jakarta Sans"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 900, letterSpacing: -0.8 },
    h2: { fontWeight: 900, letterSpacing: -0.6 },
    h3: { fontWeight: 900, letterSpacing: -0.4 },
    h4: { fontWeight: 900, letterSpacing: -0.2 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    button: { fontWeight: 800 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          paddingLeft: 16,
          paddingRight: 16,
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
});

export default theme;
