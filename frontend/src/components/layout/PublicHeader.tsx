import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const PublicHeader: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.82),
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1.25, display: 'flex', gap: 2 }}>
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
              }}
            >
              OICT{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                TUTOR
              </Box>
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  color={isActive(item.to) ? 'primary' : 'inherit'}
                  sx={{
                    fontWeight: 800,
                    bgcolor: isActive(item.to) ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    '&:hover': {
                      bgcolor: isActive(item.to)
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.text.primary, 0.06),
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button component={RouterLink} to="/login" variant="text" color="inherit" sx={{ fontWeight: 800 }}>
                Login
              </Button>
              <Button component={RouterLink} to="/register" variant="contained">
                Register
              </Button>
            </Box>

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

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 320 } }}
      >
        <Box sx={{ p: 2 }}>
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
            <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ mb: 1 }} />

          <List dense sx={{ mb: 1 }}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                selected={isActive(item.to)}
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 800 }} />
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ mb: 2 }} />

          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
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
