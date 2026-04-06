import React from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Paper,
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
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useThemeMode } from '@/context/ThemeModeContext';
import { useLocalization } from '@/context/LocalizationContext';
import { useAppSelector } from '@hooks/useAppDispatch';
import { canAccessCatalog, getDashboardPath, getRoleLabel } from '@/utils/navigation';
import LocalizationControls from '@/components/localization/LocalizationControls';

const PublicHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  const { t } = useLocalization();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const dashboardPath = getDashboardPath(user);
  const canBrowseCatalog = canAccessCatalog(user);
  const browsePath = canBrowseCatalog ? '/courses' : '/instructor/courses';
  const browseLabel = canBrowseCatalog ? t('catalog') : t('myCourses');
  const userName = user ? `${user.firstName} ${user.lastName}` : '';

  const navItems = [
    { label: t('home'), to: '/' },
    ...(canBrowseCatalog ? [{ label: t('catalog'), to: '/courses' }] : []),
    { label: t('about'), to: '/about' },
    { label: t('contact'), to: '/contact' },
  ];

  const matchesRoute = (path: string) =>
    path === '/'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      return;
    }

    navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setMobileOpen(false);
  };

  const renderNavButton = (label: string, to: string, mobile = false) => (
    <Button
      key={to}
      component={RouterLink}
      to={to}
      onClick={() => setMobileOpen(false)}
      color="inherit"
      variant="text"
      fullWidth={mobile}
      endIcon={mobile && matchesRoute(to) ? <ArrowOutwardRoundedIcon fontSize="small" /> : undefined}
      sx={{
        justifyContent: mobile ? 'space-between' : 'center',
        px: 1.5,
        borderRadius: 999,
        fontWeight: 700,
        color: matchesRoute(to) ? 'text.primary' : 'text.secondary',
        bgcolor: matchesRoute(to)
          ? alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.18)
          : 'transparent',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.14),
        },
      }}
    >
      {label}
    </Button>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1.1, gap: 2 }}>
            <Stack
              component={RouterLink}
              to="/"
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ textDecoration: 'none', flexShrink: 0 }}
            >
              <Box
                sx={(theme) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 3.5,
                  display: 'grid',
                  placeItems: 'center',
                  color: theme.palette.common.white,
                  backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: `0 16px 32px ${alpha(theme.palette.primary.main, 0.24)}`,
                })}
              >
                <Typography variant="subtitle2" sx={{ color: 'inherit' }}>
                  OT
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" color="text.primary" sx={{ lineHeight: 1 }}>
                  OICT TUTOR
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Learn clearly. Grow faster.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                display: { xs: 'none', md: 'flex' },
                ml: 1,
                p: 0.5,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'light' ? 0.04 : 0.08),
              }}
            >
              {navItems.map((item) => renderNavButton(item.label, item.to))}
            </Stack>

            {canBrowseCatalog && (
              <Box
                component="form"
                onSubmit={handleSearch}
                sx={{ flexGrow: 1, display: { xs: 'none', lg: 'flex' }, maxWidth: 320, ml: 'auto' }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('searchCourses')}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}

            <LocalizationControls />

            <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <IconButton
                onClick={toggleMode}
                aria-label="Toggle color mode"
                sx={{
                  ml: canBrowseCatalog ? 0 : 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 999,
                }}
              >
                {mode === 'light' ? (
                  <DarkModeRoundedIcon fontSize="small" />
                ) : (
                  <LightModeRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: 'none', md: 'flex' }, flexShrink: 0 }}
            >
              {isAuthenticated && user ? (
                <>
                  <Stack alignItems="flex-end" sx={{ display: { xs: 'none', xl: 'flex' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getRoleLabel(user)}
                    </Typography>
                  </Stack>
                  <Avatar
                    sx={(theme) => ({
                      width: 40,
                      height: 40,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.main',
                      fontWeight: 700,
                    })}
                  >
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </Avatar>
                  <Button component={RouterLink} to={dashboardPath} variant="contained">
                    {t('dashboard')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="text"
                    color="inherit"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.18),
                      },
                    }}
                  >
                    {t('login')}
                  </Button>
                  <Button component={RouterLink} to="/register" variant="contained">
                    {t('createAccount')}
                  </Button>
                </>
              )}
            </Stack>

            <IconButton
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 'auto' }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 340,
            p: 1.5,
            bgcolor: alpha(theme.palette.background.paper, 0.96),
            backdropFilter: 'blur(18px)',
          },
        }}
      >
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{t('navigation')}</Typography>
            <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          {isAuthenticated && user && (
            <Paper
              elevation={0}
              sx={(theme) => ({
                p: 2,
                borderRadius: 5,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              })}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={(theme) => ({
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                    color: 'primary.main',
                    fontWeight: 700,
                  })}
                >
                  {user.firstName[0]}
                  {user.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getRoleLabel(user)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {canBrowseCatalog && (
            <Box component="form" onSubmit={handleSearch}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('searchCourses')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          <Stack spacing={1}>
            {navItems.map((item) => renderNavButton(item.label, item.to, true))}
          </Stack>

          <LocalizationControls />

          <Divider />

          <Stack spacing={1.25} sx={{ mt: 'auto' }}>
            {isAuthenticated && user ? (
              <>
                <Button component={RouterLink} to={browsePath} onClick={() => setMobileOpen(false)} variant="text">
                  {browseLabel}
                </Button>
                <Button
                  component={RouterLink}
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  variant="contained"
                >
                  {t('openDashboard')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  variant="text"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.18),
                    },
                  }}
                >
                  {t('login')}
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  variant="contained"
                >
                  {t('createAccount')}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};

export default PublicHeader;
