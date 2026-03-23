import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// ── shared palette tokens ──────────────────────────────────────────────────────
const baseTokens = {
  primary:   { main: '#0F766E', light: '#14B8A6', dark: '#115E59' },
  secondary: { main: '#F97316', light: '#FB923C', dark: '#C2410C' },
  error:     { main: '#d32f2f' },
  warning:   { main: '#ed6c02' },
  info:      { main: '#0288d1' },
  success:   { main: '#2e7d32' },
};

const typography = {
  fontFamily: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Arial', 'sans-serif'].join(','),
  h1: { fontWeight: 900, letterSpacing: -0.8 },
  h2: { fontWeight: 900, letterSpacing: -0.6 },
  h3: { fontWeight: 900, letterSpacing: -0.4 },
  h4: { fontWeight: 900, letterSpacing: -0.2 },
  h5: { fontWeight: 800 },
  h6: { fontWeight: 800 },
  button: { fontWeight: 800 },
};

const componentOverrides = {
  MuiAppBar:  { styleOverrides: { root: { backgroundImage: 'none' } } },
  MuiButton:  { styleOverrides: { root: { textTransform: 'none' as const, borderRadius: 999, paddingLeft: 16, paddingRight: 16 } } },
  MuiPaper:   { styleOverrides: { root: { backgroundImage: 'none' } } },
};

// ── context ────────────────────────────────────────────────────────────────────
interface ThemeModeCtx {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeCtx>({
  mode: 'light',
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

// ── provider ───────────────────────────────────────────────────────────────────
export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stored = (localStorage.getItem('colorMode') as 'light' | 'dark') ?? 'light';
  const [mode, setMode] = useState<'light' | 'dark'>(stored);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...baseTokens,
          background: mode === 'light'
            ? { default: '#F8FAFC', paper: '#FFFFFF' }
            : { default: '#0b0d14', paper: '#111520' },
        },
        typography,
        shape: { borderRadius: 14 },
        components: componentOverrides,
      }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
