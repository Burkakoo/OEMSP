import { createTheme } from '@mui/material/styles';

// Create a custom Material-UI theme for OICT TUTOR
const theme = createTheme({
  palette: {
    primary: {
      main: '#0F766E',
      light: '#14B8A6',
      dark: '#115E59',
    },
    secondary: {
      main: '#F97316',
      light: '#FB923C',
      dark: '#C2410C',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
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
