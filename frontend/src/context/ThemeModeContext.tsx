import React, { createContext, useContext, useMemo, useState } from 'react';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const baseTokens = {
  primary: { main: '#6366F1', light: '#818CF8', dark: '#4338CA' },    // Indigo
  secondary: { main: '#A855F7', light: '#C084FC', dark: '#7E22CE' },  // Purple
  error: { main: '#F43F5E' },
  warning: { main: '#F59E0B' },
  info: { main: '#06B6D4' },
  success: { main: '#10B981' },
};

const typography = {
  fontFamily: [
    '"Plus Jakarta Sans"',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 800,
    letterSpacing: -2.5,
    lineHeight: 1.05,
  },
  h2: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 800,
    letterSpacing: -1.5,
    lineHeight: 1.1,
  },
  h3: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 800,
    letterSpacing: -1.2,
    lineHeight: 1.15,
  },
  h4: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 700,
    letterSpacing: -0.8,
    lineHeight: 1.2,
  },
  h5: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  h6: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  subtitle1: { fontWeight: 600, letterSpacing: -0.1 },
  subtitle2: { fontWeight: 600, letterSpacing: -0.15 },
  button: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  overline: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};

const getBackgroundTokens = (mode: 'light' | 'dark') =>
  mode === 'light'
    ? {
        default: '#FAFAFA',
        paper: '#FFFFFF',
        elevated: '#F3F4F6',
        textPrimary: '#111827',
        textSecondary: '#4B5563',
        divider: 'rgba(17, 24, 39, 0.08)',
      }
    : {
        default: '#0B0F19',
        paper: '#111827',
        elevated: '#1F2937',
        textPrimary: '#F9FAFB',
        textSecondary: '#9CA3AF',
        divider: 'rgba(243, 244, 246, 0.1)',
      };

const buildTheme = (mode: 'light' | 'dark') => {
  const background = getBackgroundTokens(mode);
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      ...baseTokens,
      background: {
        default: background.default,
        paper: background.paper,
      },
      text: {
        primary: background.textPrimary,
        secondary: background.textSecondary,
      },
      divider: background.divider,
    },
    typography,
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            colorScheme: mode,
          },
          body: {
            backgroundColor: background.default,
            backgroundImage: isLight
              ? 'radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08), transparent 25%), radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.08), transparent 25%)'
              : 'radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.15), transparent 25%)',
          },
          a: {
            color: 'inherit',
          },
          '::selection': {
            backgroundColor: alpha(baseTokens.primary.main, 0.25),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: alpha(background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${background.divider}`,
            boxShadow: 'none',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: 48,
            paddingInline: 24,
            textTransform: 'none',
            borderRadius: 12,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          sizeLarge: {
            minHeight: 56,
            paddingInline: 32,
            fontSize: '1.05rem',
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${baseTokens.primary.main} 0%, ${baseTokens.secondary.main} 100%)`,
            boxShadow: isLight
              ? '0 8px 20px rgba(99, 102, 241, 0.25)'
              : '0 8px 24px rgba(99, 102, 241, 0.35)',
            '&:hover': {
              boxShadow: isLight
                ? '0 12px 28px rgba(99, 102, 241, 0.35)'
                : '0 12px 32px rgba(99, 102, 241, 0.5)',
              transform: 'translateY(-2px)',
            },
          },
          outlinedPrimary: {
            borderColor: alpha(baseTokens.primary.main, isLight ? 0.3 : 0.5),
            backgroundColor: alpha(baseTokens.primary.main, isLight ? 0.02 : 0.05),
            borderWidth: 2,
            '&:hover': {
              borderColor: baseTokens.primary.main,
              backgroundColor: alpha(baseTokens.primary.main, isLight ? 0.08 : 0.12),
              borderWidth: 2,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${background.divider}`,
            boxShadow: isLight
              ? '0 12px 40px rgba(17, 24, 39, 0.05)'
              : '0 16px 48px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${background.divider}`,
            borderRadius: 24,
            backgroundColor: alpha(background.paper, isLight ? 0.7 : 0.6),
            backdropFilter: 'blur(24px)',
            boxShadow: isLight
              ? '0 20px 48px rgba(17, 24, 39, 0.05)'
              : '0 24px 64px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isLight
                ? '0 32px 64px rgba(17, 24, 39, 0.08)'
                : '0 32px 80px rgba(0, 0, 0, 0.6)',
              borderColor: alpha(baseTokens.primary.main, 0.3),
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: isLight
              ? alpha(background.elevated, 0.8)
              : alpha(background.elevated, 0.6),
            transition: 'all 0.2s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: background.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(baseTokens.primary.main, isLight ? 0.5 : 0.6),
            },
            '&.Mui-focused': {
              backgroundColor: background.paper,
              boxShadow: `0 0 0 4px ${alpha(baseTokens.primary.main, 0.15)}`,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 700,
            padding: '4px 8px',
          },
          colorPrimary: {
            background: alpha(baseTokens.primary.main, 0.1),
            color: baseTokens.primary.dark,
            ...(mode === 'dark' && {
              color: baseTokens.primary.light,
              background: alpha(baseTokens.primary.main, 0.2),
            }),
          },
        },
      },
    },
  });
};

interface ThemeModeCtx {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeCtx>({
  mode: 'light',
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'dark'; // prefer dark by default to show off modern UI
    }
    const stored = localStorage.getItem('colorMode');
    return stored === 'light' ? 'light' : 'dark';
  });

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

