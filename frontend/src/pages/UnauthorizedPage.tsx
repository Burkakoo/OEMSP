/**
 * Unauthorized page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { useAppSelector } from '@hooks/useAppDispatch';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleGoBack = () => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Unauthorized
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have permission to view this page.
        </Typography>
        <Button variant="contained" onClick={handleGoBack}>
          Go Back
        </Button>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;

