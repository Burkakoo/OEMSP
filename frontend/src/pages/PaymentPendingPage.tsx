/**
 * PaymentPendingPage - Waiting screen for async payment methods like M-Pesa
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, Alert, CircularProgress } from '@mui/material';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { RootState } from '../store';
import { fetchPayment } from '../store/slices/paymentSlice';

const POLL_INTERVAL_MS = 5000;

const PaymentPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { currentPayment, isLoading, error } = useSelector((state: RootState) => state.payment);

  const paymentId = searchParams.get('paymentId');
  const courseId = searchParams.get('courseId');
  const payment = currentPayment?._id === paymentId ? currentPayment : null;

  useEffect(() => {
    if (!paymentId) {
      return;
    }

    void dispatch(fetchPayment(paymentId));
  }, [dispatch, paymentId]);

  useEffect(() => {
    if (!paymentId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void dispatch(fetchPayment(paymentId));
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dispatch, paymentId]);

  useEffect(() => {
    if (!paymentId || !payment) {
      return;
    }

    if (payment.status === 'completed') {
      navigate(`/payment/success?paymentId=${paymentId}&courseId=${courseId || ''}`, { replace: true });
      return;
    }

    if (payment.status === 'failed') {
      navigate(
        `/payment/failure?courseId=${courseId || ''}&error=${encodeURIComponent('M-Pesa payment was not completed.')}`,
        { replace: true }
      );
    }
  }, [courseId, navigate, payment, paymentId]);

  const handleRefresh = () => {
    if (paymentId) {
      void dispatch(fetchPayment(paymentId));
    }
  };

  const handleBackToCheckout = () => {
    if (courseId) {
      navigate(`/checkout/${courseId}`);
      return;
    }

    navigate('/dashboard');
  };

  if (!paymentId) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">Missing payment reference.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <HourglassTopIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />

        <Typography variant="h4" gutterBottom>
          Payment Pending
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Check your phone and complete the M-Pesa prompt. This page refreshes automatically every 5 seconds.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        {!payment && isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {payment && (
          <>
            <Box sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Transaction ID
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                {payment.transactionId}
              </Typography>
            </Box>

            <Box sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Current Status
              </Typography>
              <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                {payment.status}
              </Typography>
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
          <Button variant="outlined" onClick={handleBackToCheckout}>
            Back to Checkout
          </Button>
          <Button variant="contained" onClick={handleRefresh}>
            Refresh Status
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentPendingPage;
