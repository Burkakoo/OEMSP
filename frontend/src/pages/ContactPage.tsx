import React from 'react';
import { Box, Card, CardContent, Container, Grid, Link, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';

const ContactPage: React.FC = () => {
  return (
    <Box>
      <Box
        sx={(theme) => ({
          py: { xs: 6, md: 8 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: `radial-gradient(900px 360px at 15% 0%, ${alpha(
            theme.palette.primary.main,
            0.18
          )} 0%, rgba(0,0,0,0) 55%), radial-gradient(900px 360px at 85% 10%, ${alpha(
            theme.palette.secondary.main,
            0.14
          )} 0%, rgba(0,0,0,0) 55%)`,
        })}
      >
        <Container maxWidth="lg">
          <Stack spacing={1.25}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 900 }}>
              Contact Us
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
              Reach out any time. We will respond as soon as possible.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 6, md: 8 } }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <EmailRoundedIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 1 }}>
                    Email
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <Link href="mailto:burkamuhammed12@gmail.com" underline="hover" color="inherit">
                      burkamuhammed12@gmail.com
                    </Link>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <PhoneRoundedIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 1 }}>
                    Phone
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <Link href="tel:+251915200879" underline="hover" color="inherit">
                      +251915200879
                    </Link>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <LocationOnRoundedIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 1 }}>
                    Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Addis Ababa
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactPage;
