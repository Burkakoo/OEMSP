import React from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector } from '@hooks/useAppDispatch';
import { getDashboardPath } from '@/utils/navigation';
import { useLocalization } from '@/context/LocalizationContext';

const PublicFooter: React.FC = () => {
  const year = new Date().getFullYear();
  const { t } = useLocalization();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  return (
    <Box
      component="footer"
      sx={(theme) => ({
        mt: 8,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(
          theme.palette.secondary.main,
          0.04
        )} 100%)`,
      })}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 7,
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.12
            )} 100%)`,
          })}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {t('keepLearningTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('keepLearningSubtitle')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.25}>
                <Button
                  component={RouterLink}
                  to={isAuthenticated ? getDashboardPath(user) : '/register'}
                  variant="contained"
                  size="large"
                >
                  {isAuthenticated ? t('openDashboard') : t('createAccount')}
                </Button>
                <Button component={RouterLink} to="/contact" variant="outlined" size="large">
                  {t('contactSupport')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3} sx={{ pb: 4 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">OICT TUTOR</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
                {t('footerDescription')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Addis Ababa, Ethiopia
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, md: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
              {t('product')}
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/" underline="hover" color="text.secondary">
                {t('home')}
              </Link>
              <Link component={RouterLink} to="/courses" underline="hover" color="text.secondary">
                {t('catalog')}
              </Link>
              <Link component={RouterLink} to="/about" underline="hover" color="text.secondary">
                {t('about')}
              </Link>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, md: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
              {t('support')}
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/contact" underline="hover" color="text.secondary">
                {t('contact')}
              </Link>
              <Link href="mailto:burkamuhammed12@gmail.com" underline="hover" color="text.secondary">
                Email us
              </Link>
              <Link href="tel:+251915200879" underline="hover" color="text.secondary">
                +251915200879
              </Link>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
              {t('access')}
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/login" underline="hover" color="text.secondary">
                {t('login')}
              </Link>
              <Link component={RouterLink} to="/register" underline="hover" color="text.secondary">
                {t('createAccount')}
              </Link>
              <Link component={RouterLink} to="/forgot-password" underline="hover" color="text.secondary">
                {t('resetPassword')}
              </Link>
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            py: 2.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {year} OICT TUTOR. {t('allRightsReserved')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('modernLearning')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicFooter;
