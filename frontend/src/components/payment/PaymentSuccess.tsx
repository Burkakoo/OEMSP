/**
 * PaymentSuccess component - Displays payment success message
 */

import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessProps {
  transactionId: string;
  amount: number;
  currency: string;
  courseId?: string;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  transactionId,
  amount,
  currency,
  courseId,
}) => {
  const navigate = useNavigate();

  const handleGoToCourse = () => {
    if (courseId) {
      navigate(`/courses/${courseId}/learn`);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      
      <Typography variant="h4" gutterBottom>
        Payment Successful!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Your payment has been processed successfully.
      </Typography>

      <Box sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Transaction ID
        </Typography>
        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
          {transactionId}
        </Typography>
      </Box>

      <Box sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Amount Paid
        </Typography>
        <Typography variant="h5">
          {amount} {currency}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
        <Button variant="outlined" onClick={handleGoToDashboard}>
          Go to Dashboard
        </Button>
        {courseId && (
          <Button variant="contained" onClick={handleGoToCourse}>
            Go to Course
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default PaymentSuccess;
