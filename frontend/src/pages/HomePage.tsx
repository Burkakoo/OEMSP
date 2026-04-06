import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LoginPopup, RegisterPopup } from '@components/auth';
import { useAppSelector } from '@hooks/useAppDispatch';
import { canAccessCatalog, getDashboardPath } from '@/utils/navigation';

const quickStats = [
  { value: '100+', label: 'Curated courses' },
  { value: '10k+', label: 'Learners supported' },
  { value: '24/7', label: 'Flexible access' },
];

const featureCards = [
  {
    icon: SchoolOutlinedIcon,
    title: 'Clear learning paths',
    description: 'Move from registration to course progress without getting lost in extra steps.',
  },
  {
    icon: WorkspacePremiumOutlinedIcon,
    title: 'Certificates included',
    description: 'Completed courses stay easy to find, verify, and download.',
  },
  {
    icon: BoltOutlinedIcon,
    title: 'Fast to start',
    description: 'Short forms and focused actions help users begin in minutes.',
  },
  {
    icon: QueryStatsOutlinedIcon,
    title: 'Better visibility',
    description: 'Students, instructors, and admins can all see what matters most.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create your space',
    description: 'Register once, verify your email, and land in the dashboard that matches your role.',
  },
  {
    step: '02',
    title: 'Pick the next action',
    description: 'Browse a course, continue learning, manage classes, or review reports from a single place.',
  },
  {
    step: '03',
    title: 'Track real progress',
    description: 'Watch progress, quizzes, and certificates update without hunting through different screens.',
  },
];

const audienceCards = [
  {
    icon: PlayCircleOutlineRoundedIcon,
    title: 'For learners',
    description: 'A simple dashboard for enrolled courses, quizzes, progress, and certificates.',
  },
  {
    icon: Groups2RoundedIcon,
    title: 'For instructors',
    description: 'Manage courses, students, and assignments from a cleaner teaching workspace.',
  },
  {
    icon: AutoAwesomeRoundedIcon,
    title: 'For teams',
    description: 'Review platform activity, approvals, and reports with a more modern admin shell.',
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const dashboardPath = getDashboardPath(user);
  const catalogPath = canAccessCatalog(user) ? '/courses' : '/instructor/courses';
  const catalogLabel = canAccessCatalog(user) ? 'Browse catalog' : 'View your courses';

  useEffect(() => {
    if (isAuthenticated && user && (loginOpen || registerOpen)) {
      setLoginOpen(false);
      setRegisterOpen(false);
      navigate(getDashboardPath(user));
    }
  }, [isAuthenticated, loginOpen, navigate, registerOpen, user]);

  const handlePrimaryAction = () => {
    if (isAuthenticated && user) {
      navigate(dashboardPath);
      return;
    }
    setRegisterOpen(true);
  };

  const handleLoginClick = () => {
    if (isAuthenticated && user) {
      navigate(dashboardPath);
      return;
    }
    setLoginOpen(true);
  };

  const handleRegisterClick = () => {
    if (isAuthenticated && user) {
      navigate(dashboardPath);
      return;
    }
    setRegisterOpen(true);
  };

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* ── HERO SECTION ── */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 8, md: 14 },
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `radial-gradient(circle at 15% 30%, ${alpha(
              theme.palette.primary.main,
              0.15
            )} 0%, transparent 40%), radial-gradient(circle at 85% 60%, ${alpha(
              theme.palette.secondary.main,
              0.15
            )} 0%, transparent 40%)`,
            zIndex: -1,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center" justifyContent="space-between">
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={4}>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Chip
                    label="Modern LMS experience"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      fontWeight: 800,
                      px: 1,
                    }}
                  />
                  <Chip label="Simple onboarding" variant="outlined" sx={{ fontWeight: 700 }} />
                </Stack>

                <Stack spacing={2.5}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3.75rem' },
                      fontWeight: 900,
                      lineHeight: 1.1,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    start your journey with OICT to get a{' '}
                    <Box
                      component="span"
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Certificate with Diploma and more
                    </Box>{'  '}
                    Online learning management system.
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 540, fontWeight: 500, lineHeight: 1.6 }}>
                    OICT TUTOR brings students, instructors, and administrators into one beautiful platform
                    designed for growth, clarity, and success.
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} pt={1}>
                  <Button
                    onClick={handlePrimaryAction}
                    variant="contained"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                    }}
                  >
                    {isAuthenticated ? 'Open dashboard' : 'Create free account'}
                  </Button>
                  <Button
                    component={RouterLink}
                    to={catalogPath}
                    variant="outlined"
                    size="large"
                    sx={{ px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 800 }}
                  >
                    {catalogLabel}
                  </Button>
                </Stack>

                <Grid container spacing={3} pt={4}>
                  {quickStats.map((stat) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  p: { xs: 3, md: 4 },
                  borderRadius: 6,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(24px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `0 24px 80px ${alpha(theme.palette.common.black, 0.2)}`,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -24, right: -24,
                    width: 100, height: 100,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    filter: 'blur(40px)',
                    opacity: 0.4,
                    zIndex: -1,
                  }}
                />
                <Stack spacing={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>
                        Learning cockpit
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                        Progress at a glance
                      </Typography>
                    </Box>
                    <Chip label="Live" size="small" variant="outlined" color="success" />
                  </Stack>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Business Analytics Foundations
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Updated this week
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 900 }}>
                          84%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={84}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Stack>
                  </Paper>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.background.paper, 0.5),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                      >
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                          3
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Active Courses
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.background.paper, 0.5),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                      >
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                          12
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Pending Lessons
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Stack spacing={1.5} pt={1}>
                    {[
                      'Role-based clean dashboards',
                      'Instant short onboarding',
                      'Mobile-first responsive clarity',
                    ].map((item) => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                        <CheckCircleRoundedIcon color="primary" fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── FEATURES SECTION ── */}
      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 8, md: 10 } }}>
          <Stack spacing={2} sx={{ mb: 6, textAlign: 'center', alignItems: 'center' }}>
            <Typography variant="overline" color="secondary.main" sx={{ letterSpacing: 2 }}>
              Why it feels better
            </Typography>
            <Typography variant="h2" sx={{ maxWidth: 800 }}>
              A more polished experience across the whole application
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 660, fontSize: '1.1rem' }}>
              The interface is designed to feel cleaner, calmer, and easier to understand whether
              you are signing in, learning, teaching, or managing the platform.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {featureCards.map(({ icon: Icon, title, description }) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={title}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    borderRadius: 5,
                    height: '100%',
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.1)}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      mb: 2.5,
                      borderRadius: 4,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                    }}
                  >
                    <Icon fontSize="medium" />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ── HOW IT WORKS SECTION ── */}
        <Box id="how-it-works" sx={{ py: { xs: 8, md: 10 } }}>
          <Stack spacing={2} sx={{ mb: 6 }}>
            <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 2 }}>
              How it works
            </Typography>
            <Typography variant="h2">Start quickly without friction</Typography>
          </Stack>

          <Grid container spacing={4}>
            {steps.map((step) => (
              <Grid size={{ xs: 12, md: 4 }} key={step.step}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 6,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: '4px',
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      opacity: 0.5,
                    },
                  }}
                >
                  <Typography
                    variant="h2"
                    color="text.secondary"
                    sx={{ opacity: 0.2, fontWeight: 900, mb: 2, fontSize: '4rem !important' }}
                  >
                    {step.step}
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 800 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {step.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ── AUDIENCE SECTION ── */}
        <Box sx={{ py: { xs: 8, md: 10 } }}>
          <Grid container spacing={3}>
            {audienceCards.map(({ icon: Icon, title, description }) => (
              <Grid size={{ xs: 12, md: 4 }} key={title}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 6,
                    height: '100%',
                    bgcolor: alpha(theme.palette.background.paper, 0.3),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 30px ${alpha(theme.palette.common.black, 0.1)}`,
                    },
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: 'secondary.main',
                      }}
                    >
                      <Icon fontSize="large" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {description}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* ── CTA SECTION ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative' }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              p: { xs: 4, md: 6 },
              borderRadius: 8,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(
                theme.palette.secondary.main,
                0.2
              )})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '0%', left: '0%', right: '0%', bottom: '0%',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23a855f7\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                zIndex: 0,
              }}
            />
            <Grid container spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="h2" sx={{ mb: 2, fontWeight: 900 }}>
                  Ready for a simpler learning experience?
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                  Jump in with a fresh account or continue right where you left off.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                  <Button
                    onClick={handleRegisterClick}
                    variant="contained"
                    size="large"
                    sx={{ flex: 1, py: 2, fontWeight: 800, fontSize: '1.1rem' }}
                  >
                    {isAuthenticated ? 'Go to dashboard' : 'Create account'}
                  </Button>
                  <Button
                    onClick={handleLoginClick}
                    variant="outlined"
                    size="large"
                    sx={{
                      flex: 1, py: 2, fontWeight: 800, fontSize: '1.1rem',
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      backdropFilter: 'blur(8px)',
                    }}
                    endIcon={<ArrowOutwardRoundedIcon />}
                  >
                    {isAuthenticated ? 'Open my space' : 'Login'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      <LoginPopup
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onRegisterClick={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
        onForgotPasswordClick={() => navigate('/forgot-password')}
      />

      <RegisterPopup
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onLoginClick={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </Box>
  );
};

export default HomePage;
