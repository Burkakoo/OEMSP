import React from 'react';
import { Box, Container, Divider, Link, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

const PublicFooter: React.FC = () => {
  const year = new Date().getFullYear();
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        mt: 8,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.primary.main, 0.04),
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ py: 5, display: 'flex', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 240, maxWidth: 420 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              OICT <Box component="span" sx={{ color: 'primary.main' }}>TUTOR</Box>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Scalable, secure, and efficient learning management for modern online education.
            </Typography>
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              Quick Links
            </Typography>
            <Stack spacing={0.75}>
              <Link component={RouterLink} to="/" underline="hover" color="text.secondary">
                Home
              </Link>
              <Link component={RouterLink} to="/about" underline="hover" color="text.secondary">
                About Us
              </Link>
              <Link component={RouterLink} to="/contact" underline="hover" color="text.secondary">
                Contact Us
              </Link>
            </Stack>
          </Box>

          <Box sx={{ minWidth: 220 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              Contact
            </Typography>
            <Stack spacing={0.75}>
              <Typography variant="body2" color="text.secondary">
                Email: burkamuhammed12@gmail.com
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: +251915200879
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Address: Addis Ababa
              </Typography>
            </Stack>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ py: 2.5, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            (c) {year} OICT TUTOR. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Addis Ababa, Ethiopia
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicFooter;

