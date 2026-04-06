import React from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';

const CONTACT_EMAIL = 'support@oicttutor.com';

const ContactPage: React.FC = () => {
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
            backgroundImage: `radial-gradient(ellipse at 85% 0%, ${alpha(
              theme.palette.primary.main,
              0.15
            )} 0%, transparent 60%), radial-gradient(ellipse at 15% 10%, ${alpha(
              theme.palette.secondary.main,
              0.15
            )} 0%, transparent 60%)`,
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography variant="overline" color="secondary.main" sx={{ letterSpacing: 3 }}>
              Get In Touch
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '2.5rem', md: '4rem' } }}>
              Contact <span style={{ color: theme.palette.secondary.main }}>Us</span>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.15rem', maxWidth: 640, lineHeight: 1.6 }}>
              Have a question or need to report an issue? Drop us a line and we'll get back to you as soon as possible.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* ── CONTENT BODY ── */}
      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 8, md: 10 } }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                    Let's talk
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Whether you're curious about features, a free trial, or even press, we're ready to answer any and all questions.
                  </Typography>
                </Box>

                <Stack spacing={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateX(4px)' }
                    }}
                  >
                    <Box
                      sx={{
                        width: 48, height: 48,
                        borderRadius: 3,
                        display: 'grid', placeItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                      }}
                    >
                      <EmailOutlinedIcon />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Email</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{CONTACT_EMAIL}</Typography>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateX(4px)' }
                    }}
                  >
                    <Box
                      sx={{
                        width: 48, height: 48,
                        borderRadius: 3,
                        display: 'grid', placeItems: 'center',
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: 'secondary.main',
                      }}
                    >
                      <PhoneOutlinedIcon />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Phone support</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>+1 (555) 000-0000</Typography>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateX(4px)' }
                    }}
                  >
                    <Box
                      sx={{
                        width: 48, height: 48,
                        borderRadius: 3,
                        display: 'grid', placeItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                      }}
                    >
                      <LocationOnOutlinedIcon />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Office</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Global Remote</Typography>
                    </Box>
                  </Paper>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, md: 5 },
                  borderRadius: 6,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(24px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.1)}`,
                }}
              >
                <form 
                  action={`mailto:${CONTACT_EMAIL}`}
                  method="POST"
                  encType="text/plain"
                  onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = `mailto:${CONTACT_EMAIL}`;
                  }}
                >
                  <Stack spacing={3}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          required
                          fullWidth
                          label="First Name"
                          name="firstName"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          required
                          fullWidth
                          label="Last Name"
                          name="lastName"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      required
                      fullWidth
                      label="Email Address"
                      type="email"
                      name="email"
                      variant="outlined"
                    />
                    
                    <TextField
                      required
                      fullWidth
                      label="Subject"
                      name="subject"
                      variant="outlined"
                    />

                    <TextField
                      required
                      fullWidth
                      label="Message"
                      name="message"
                      multiline
                      rows={5}
                      variant="outlined"
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      sx={{
                        py: 2,
                        mt: 1,
                        fontSize: '1.1rem',
                        fontWeight: 800,
                      }}
                    >
                      Send message
                    </Button>
                  </Stack>
                </form>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactPage;
