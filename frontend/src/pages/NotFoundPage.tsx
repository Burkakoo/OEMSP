/**
 * Not found page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The page you are looking for doesn't exist.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard', { replace: true })}>
          Go To Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;

