import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  Grid,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

const PLATFORM_BLURB =
  'The rapid growth of online education has increased the demand for scalable, secure, and efficient learning management systems.';

const HomePage: React.FC = () => {
  return (
    <Box>
      <Box
        sx={(theme) => ({
          py: { xs: 6, md: 10 },
          backgroundImage: `radial-gradient(1200px 520px at 12% 0%, ${alpha(
            theme.palette.primary.main,
            0.22
          )} 0%, ${alpha(theme.palette.primary.main, 0.06)} 55%, rgba(0,0,0,0) 70%), radial-gradient(900px 460px at 86% 18%, ${alpha(
            theme.palette.secondary.main,
            0.22
          )} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 55%, rgba(0,0,0,0) 70%)`,
        })}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2.25}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label="OICT TUTOR" color="primary" sx={{ fontWeight: 900 }} />
                  <Chip label="Certificates included" variant="outlined" sx={{ fontWeight: 800 }} />
                  <Chip label="Learn anywhere" variant="outlined" sx={{ fontWeight: 800 }} />
                </Stack>

                <Typography variant="h2" component="h1" sx={{ lineHeight: 1.06 }}>
                  Online Courses With Certificates & Diplomas.
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 680 }}>
                  Explore 100+ Online Courses with certificates. Advance Your Career. Learn In-demand Skills.
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ fontSize: 16, maxWidth: 760 }}>
                  {PLATFORM_BLURB} Upskill in business analytics, graphic design, management and more.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
                  <Button component={RouterLink} to="/register" variant="contained" size="large">
                    Get Started
                  </Button>
                  <Button component={RouterLink} to="/login" variant="outlined" size="large">
                    Login
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/courses"
                    variant="text"
                    color="inherit"
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{ justifyContent: 'flex-start', px: 0.5, alignSelf: { xs: 'flex-start', sm: 'center' } }}
                  >
                    Browse courses
                  </Button>
                </Stack>

                <Paper
                  elevation={0}
                  sx={(theme) => ({
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.background.paper, 0.78),
                    backdropFilter: 'blur(10px)',
                  })}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        100+
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        High-quality courses
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        10,000+
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Empowered learners
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        CPD
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Accredited learning
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={2}>
                <Card
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
                  }}
                >
                  <CardActionArea component={RouterLink} to="/courses">
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <SchoolOutlinedIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                          Courses
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Browse our course catalog. If you are not logged in, you will be redirected to the login page.
                      </Typography>
                      <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
                        Browse Courses
                      </Button>
                    </CardContent>
                  </CardActionArea>
                </Card>

                <Card
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 4,
                    bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.06),
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.75 }}>
                      For organizations
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Tailored plans for teams, reporting with real-time analytics, and curated learning paths.
                    </Typography>
                    <Button component={RouterLink} to="/about" variant="outlined">
                      Learn more
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            Built for learners and teams
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Simple to start, powerful to scale as your learning needs grow.
          </Typography>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 4,
                  p: 0.5,
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <WorkspacePremiumOutlinedIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 1 }}>
                    Certificates & Diplomas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Complete courses and earn certificates that support your career goals and credibility.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 4,
                  p: 0.5,
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <BoltOutlinedIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 1 }}>
                    Micro Courses
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Learn in focused bursts with targeted content designed for quick progress.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 4,
                  p: 0.5,
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <QueryStatsOutlinedIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 1 }}>
                    Real-time Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Get comprehensive reporting to track engagement, learning progress, and outcomes.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <Box sx={(theme) => ({ py: { xs: 6, md: 8 }, bgcolor: alpha(theme.palette.primary.main, 0.05) })}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: { xs: 3, md: 4 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 5,
              backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
                theme.palette.secondary.main,
                0.12
              )} 100%)`,
            })}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                  Start learning today with OICT TUTOR
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create an account in minutes and explore courses that match your goals.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.25}>
                  <Button component={RouterLink} to="/register" variant="contained" size="large">
                    Create Account
                  </Button>
                  <Button component={RouterLink} to="/courses" variant="outlined" size="large">
                    Browse Courses
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
