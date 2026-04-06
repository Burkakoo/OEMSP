import React from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { canAccessCatalog, getDashboardPath, getRoleLabel } from '@/utils/navigation';
import { useLocalization } from '@/context/LocalizationContext';
import LocalizationControls from '@/components/localization/LocalizationControls';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface DashboardNavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useLocalization();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const dashboardPath = getDashboardPath(user);
  const roleLabel = getRoleLabel(user);
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Account';

  const navItems = React.useMemo<DashboardNavItem[]>(() => {
    if (user?.role === 'student') {
      return [
        { label: t('dashboard'), to: '/student/dashboard', icon: DashboardRoundedIcon },
        { label: t('browseCourses'), to: '/courses', icon: SchoolRoundedIcon },
      ];
    }

    if (user?.role === 'instructor') {
      return [
        { label: t('dashboard'), to: '/instructor/dashboard', icon: DashboardRoundedIcon },
        { label: t('myCourses'), to: '/instructor/courses', icon: LibraryBooksRoundedIcon },
        { label: t('assignments'), to: '/instructor/assignments', icon: AssignmentTurnedInRoundedIcon },
        { label: t('createCourse'), to: '/instructor/courses/create', icon: AddCircleRoundedIcon },
      ];
    }

    if (user?.role === 'admin') {
      return [{ label: t('dashboard'), to: '/admin/dashboard', icon: DashboardRoundedIcon }];
    }

    return [];
  }, [t, user]);

  const matchesRoute = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const renderNavButton = (item: DashboardNavItem, mobile = false) => {
    const Icon = item.icon;

    return (
      <Button
        key={item.to}
        component={RouterLink}
        to={item.to}
        onClick={() => setMobileOpen(false)}
        color="inherit"
        variant="text"
        fullWidth={mobile}
        startIcon={<Icon fontSize="small" />}
        sx={{
          justifyContent: mobile ? 'flex-start' : 'center',
          borderRadius: 999,
          px: 1.5,
          color: matchesRoute(item.to) ? 'text.primary' : 'text.secondary',
          bgcolor: matchesRoute(item.to)
            ? alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.18)
            : 'transparent',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.14),
          },
        }}
      >
        {item.label}
      </Button>
    );
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-10% auto auto -10%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: alpha(theme.palette.primary.main, 0.12),
          filter: 'blur(44px)',
          pointerEvents: 'none',
        },
      })}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.82),
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 1.1, gap: 2 }}>
            <Stack
              component={RouterLink}
              to={dashboardPath}
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
                  {roleLabel}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                display: { xs: 'none', md: 'flex' },
                p: 0.5,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'light' ? 0.04 : 0.08),
              }}
            >
              {navItems.map((item) => renderNavButton(item))}
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ ml: 'auto', display: { xs: 'none', md: 'flex' } }}
            >
              <LocalizationControls />

              {canAccessCatalog(user) && user?.role !== 'student' && (
                <Button component={RouterLink} to="/courses" variant="text" color="inherit">
                  {t('courseCatalog')}
                </Button>
              )}

              <Paper
                elevation={0}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  py: 0.75,
                  pl: 0.75,
                  pr: 1.25,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                })}
              >
                <Avatar
                  sx={(theme) => ({
                    width: 38,
                    height: 38,
                    bgcolor: alpha(theme.palette.primary.main, 0.14),
                    color: 'primary.main',
                    fontWeight: 700,
                  })}
                >
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </Avatar>
                <Box sx={{ minWidth: 0, display: { xs: 'none', lg: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                    {userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {roleLabel}
                  </Typography>
                </Box>
                <Chip label={roleLabel} size="small" sx={{ display: { xs: 'inline-flex', lg: 'none' } }} />
              </Paper>

              <Button
                onClick={handleLogout}
                variant="text"
                color="inherit"
                startIcon={<LogoutRoundedIcon fontSize="small" />}
              >
                {t('logout')}
              </Button>
            </Stack>

            <IconButton
              aria-label="Open navigation"
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
            width: 320,
            p: 1.5,
            bgcolor: alpha(theme.palette.background.paper, 0.96),
            backdropFilter: 'blur(18px)',
          },
        }}
      >
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{t('workspace')}</Typography>
            <IconButton aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

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
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {userName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleLabel}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Stack spacing={1}>
            {navItems.map((item) => renderNavButton(item, true))}
          </Stack>

          <LocalizationControls />

          <Divider />

          <Stack spacing={1.25} sx={{ mt: 'auto' }}>
            {canAccessCatalog(user) && user?.role !== 'student' && (
              <Button component={RouterLink} to="/courses" onClick={() => setMobileOpen(false)} variant="text">
                {t('courseCatalog')}
              </Button>
            )}
            <Button
              onClick={() => {
                setMobileOpen(false);
                void handleLogout();
              }}
              color="inherit"
              variant="contained"
              startIcon={<LogoutRoundedIcon fontSize="small" />}
            >
              {t('logout')}
            </Button>
          </Stack>
        </Stack>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
