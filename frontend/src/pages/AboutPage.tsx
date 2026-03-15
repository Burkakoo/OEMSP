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
import { alpha } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

const PLATFORM_BLURB =
  'The rapid growth of online education has increased the demand for scalable, secure, and efficient learning management systems.';

const AboutPage: React.FC = () => {
  return (
    <Box>
      <Box
        sx={(theme) => ({
          py: { xs: 6, md: 8 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: `radial-gradient(900px 360px at 15% 0%, ${alpha(
            theme.palette.primary.main,
            0.2
          )} 0%, rgba(0,0,0,0) 55%), radial-gradient(900px 360px at 85% 10%, ${alpha(
            theme.palette.secondary.main,
            0.18
          )} 0%, rgba(0,0,0,0) 55%)`,
        })}
      >
        <Container maxWidth="lg">
          <Stack spacing={1.5}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 900 }}>
              About Us
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: 16, maxWidth: 840 }}>
              {PLATFORM_BLURB}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 4,
                }}
              >
                <Stack spacing={2.25}>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Over 10000+ learners have used OICT TUTOR to empower themselves
                  </Typography>

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                      A Faster Way For Your Employees To Grow And Upskill
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
                      Our range of solutions has something to offer all businesses and organizations. Whether
                      you're a non-profit or a commercial entity, we can tailor a plan for your needs.
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
                      Manage Your Upskilling Needs:
                    </Typography>
                    <List dense sx={{ pt: 0, pb: 0 }}>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <CheckCircleRoundedIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="100+ high-quality courses with certificates" />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <CheckCircleRoundedIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Curated and custom learning paths" />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <CheckCircleRoundedIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="CPD accredited learning provider" />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <CheckCircleRoundedIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Easy set-up in under 5 minutes" />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <CheckCircleRoundedIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Comprehensive reporting with real-time analytics" />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 34 }}>
                          <CheckCircleRoundedIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Targeted learning with micro courses" />
                      </ListItem>
                    </List>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                      Alison is a Power For Good
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
                      We believe that online education, more than anything, has the power to break through boundaries
                      and transform lives.
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                      Founded in 2026
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
                      Founded in 2026, OICT TUTOR is the largest online empowerment platform for education and skills
                      training, offering over 1,000 CPD accredited courses and a range of impactful career development
                      tools. It is a for-profit social enterprise dedicated to making it possible for anyone, to study
                      anything, anywhere, at any time, for free online, at any subject level. Through our mission, we
                      are a catalyst for positive social change, creating opportunity, prosperity, and equality for
                      everyone
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
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
                    backgroundImage: (theme) =>
                      `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
                        theme.palette.secondary.main,
                        0.1
                      )} 100%)`,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.75 }}>
                      At a glance
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                          10,000+
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Learners
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                          100+
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Courses
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                          CPD
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Accredited provider
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.75 }}>
                      Mission
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
