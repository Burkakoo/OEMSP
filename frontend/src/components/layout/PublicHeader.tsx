import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useThemeMode } from '@/context/ThemeModeContext';

const PublicHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const navItems = [
    { label: 'Home',       to: '/' },
    { label: 'Courses',    to: '/courses' },
    { label: 'About Us',   to: '/about' },
    { label: 'Contact Us', to: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1.25, display: 'flex', gap: 2 }}>

            {/* ── Brand ── */}
            <Typography
              component={RouterLink}
              to="/"
              variant="h6"
              color="text.primary"
              sx={{
                textDecoration: 'none',
                fontWeight: 900,
                letterSpacing: -0.2,
                lineHeight: 1.1,
                flexShrink: 0,
              }}
            >
              OICT{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                TUTOR
              </Box>
            </Typography>

            {/* ── Desktop Nav Items ── */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  variant="contained"
                  color={isActive(item.to) ? 'primary' : 'inherit'}
                  sx={{
                    fontWeight: 800,
                    ...(isActive(item.to) && {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
                    }),
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* ── Desktop Search Bar ── */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, maxWidth: 280 }}
            >
              <TextField
                size="small"
                fullWidth
                placeholder="Search courses…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 999,
                    bgcolor: alpha(theme.palette.text.primary, 0.05),
                    '&:hover fieldset': { borderColor: 'primary.main' },
                  },
                }}
              />
            </Box>

            {/* ── Dark / Light Mode Toggle ── */}
            <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              <IconButton
                onClick={toggleMode}
                aria-label="Toggle colour mode"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 999,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' },
                }}
              >
                {mode === 'light' ? <DarkModeRoundedIcon fontSize="small" /> : <LightModeRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* ── Desktop Auth Buttons ── */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexShrink: 0 }}>
              <Button component={RouterLink} to="/login" variant="contained" sx={{ fontWeight: 800 }}>
                Login
              </Button>
              <Button component={RouterLink} to="/register" variant="contained">
                Register
              </Button>
            </Box>

            {/* ── Mobile Hamburger ── */}
            <IconButton
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              sx={{ ml: 'auto', display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ══════════════════════════════════════
          Mobile Drawer
      ══════════════════════════════════════ */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 320 } }}
      >
        <Box sx={{ p: 2 }}>
          {/* Drawer header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography
              component={RouterLink}
              to="/"
              variant="h6"
              color="text.primary"
              onClick={() => setMobileOpen(false)}
              sx={{ textDecoration: 'none', fontWeight: 900, letterSpacing: -0.2 }}
            >
              OICT <Box component="span" sx={{ color: 'primary.main' }}>TUTOR</Box>
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              {/* Dark mode toggle inside drawer */}
              <Tooltip title={mode === 'light' ? 'Dark Mode' : 'Light Mode'}>
                <IconButton
                  onClick={toggleMode}
                  size="small"
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 999 }}
                >
                  {mode === 'light' ? <DarkModeRoundedIcon fontSize="small" /> : <LightModeRoundedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Mobile Search */}
          <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search courses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.text.primary, 0.05),
                },
              }}
            />
          </Box>

          {/* Mobile Nav Items */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                variant="contained"
                fullWidth
                onClick={() => setMobileOpen(false)}
                sx={{
                  fontWeight: 800,
                  ...(isActive(item.to) && {
                    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
                  }),
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {/* Mobile Auth Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              fullWidth
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              fullWidth
              onClick={() => setMobileOpen(false)}
            >
              Register
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};

export default PublicHeader;
