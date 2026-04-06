import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Grid,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';

const PLATFORM_BLURB =
  'The rapid growth of online education has increased the demand for scalable, secure, and efficient learning management systems. We aim to break through boundaries and transform lives.';

const AboutPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* ── HEADER ── */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 8, md: 12 },
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: theme.palette.background.default,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `radial-gradient(ellipse at 15% 0%, ${alpha(
              theme.palette.primary.main,
              0.15
            )} 0%, transparent 60%), radial-gradient(ellipse at 85% 10%, ${alpha(
              theme.palette.secondary.main,
              0.15
            )} 0%, transparent 60%)`,
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 3 }}>
              Our Story
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '4rem' } }}>
              About <span style={{ color: theme.palette.primary.main }}>Us</span>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.15rem', maxWidth: 840, lineHeight: 1.6 }}>
              {PLATFORM_BLURB}
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* ── CONTENT BODY ── */}
      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 8, md: 10 } }}>
          <Grid container spacing={5} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, md: 5 },
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 6,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.1)}`,
                }}
              >
                <Stack spacing={4}>
                  <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.3 }}>
                    Empowering over <span style={{ color: theme.palette.secondary.main }}>10,000+</span> learners to grow and upskill
                  </Typography>

                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                      A Faster Way For Your Employees To Grow
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Our range of solutions has something to offer all businesses and organizations. Whether
                      you're a non-profit or a commercial entity, we can tailor a plan for your needs perfectly.
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 800, mb: 2, letterSpacing: 1, textTransform: 'uppercase' }}>
                      Manage Your Upskilling Needs:
                    </Typography>
                    <List dense sx={{ pt: 0, pb: 0 }}>
                      {[
                        '100+ high-quality courses with certificates',
                        'Curated and custom learning paths',
                        'CPD accredited learning provider',
                        'Easy set-up in under 5 minutes',
                        'Comprehensive reporting with real-time analytics',
                        'Targeted learning with micro courses',
                      ].map((text, i) => (
                        <ListItem key={i} disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleRoundedIcon color="secondary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={text} 
                            primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                      OICT TUTOR is a Power For Good
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      We believe that online education, more than anything, has the power to break through boundaries
                      and transform lives. 
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                      Founded in 2026
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Founded in 2026, OICT TUTOR is a fast-growing empowerment platform for education and skills
                      training, offering over 100+ CPD accredited courses and a range of impactful career development
                      tools. Through our mission, we are a catalyst for positive social change, creating opportunity, 
                      prosperity, and equality for everyone.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={4}>
                {/* At a glance Card */}
                <Card
                  elevation={0}
                  sx={{
                    border: 'none',
                    borderRadius: 6,
                    position: 'relative',
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                    color: '#fff',
                    boxShadow: `0 24px 48px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0, right: 0,
                      width: '100%', height: '100%',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }}
                  />
                  <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                    <Typography variant="overline" sx={{ fontWeight: 900, mb: 2, display: 'block', letterSpacing: 2, color: alpha('#fff', 0.8) }}>
                      At a glance
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 6 }}>
                        <GroupsRoundedIcon sx={{ fontSize: 40, mb: 1, color: alpha('#fff', 0.9) }} />
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                          10k+
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha('#fff', 0.7), fontWeight: 600 }}>
                          Learners
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <WorkspacePremiumRoundedIcon sx={{ fontSize: 40, mb: 1, color: alpha('#fff', 0.9) }} />
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                          100+
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha('#fff', 0.7), fontWeight: 600 }}>
                          Courses
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <VerifiedUserRoundedIcon sx={{ fontSize: 40, mb: 1, color: alpha('#fff', 0.9) }} />
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                          CPD
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha('#fff', 0.7), fontWeight: 600 }}>
                          Accredited provider
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Mission Card */}
                <Card 
                  elevation={0} 
                  sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
                    borderRadius: 6,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    backdropFilter: 'blur(12px)', 
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="overline" color="secondary.main" sx={{ fontWeight: 900, mb: 1, display: 'block', letterSpacing: 2 }}>
                      Our Mission
                    </Typography>
                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, lineHeight: 1.5 }}>
                      Make it possible for anyone to study anything, anywhere, at any time, for free online.
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutPage;
