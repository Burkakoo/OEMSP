/**
 * PaymentFailurePage - Payment failure page
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

const PaymentFailurePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const errorMessage = searchParams.get('error') || 'Payment processing failed';

  const handleRetry = () => {
    if (courseId) {
      navigate(`/checkout/${courseId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h4" gutterBottom>
          Payment Failed
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {errorMessage}
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          Your payment could not be processed. Please try again or contact support if the problem persists.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
          <Button variant="outlined" onClick={handleGoToDashboard}>
            Go to Dashboard
          </Button>
          {courseId && (
            <Button variant="contained" onClick={handleRetry}>
              Try Again
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentFailurePage;
