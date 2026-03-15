/**
 * PaymentSuccessPage - Payment success confirmation page
 */

import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchPayment } from '../store/slices/paymentSlice';
import PaymentSuccess from '../components/payment/PaymentSuccess';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { currentPayment, isLoading, error } = useSelector(
    (state: RootState) => state.payment
  );

  const paymentId = searchParams.get('paymentId');
  const courseId = searchParams.get('courseId');

  useEffect(() => {
    if (paymentId) {
      dispatch(fetchPayment(paymentId));
    }
  }, [paymentId, dispatch]);

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!currentPayment) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="info">Payment information not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <PaymentSuccess
        transactionId={currentPayment.transactionId}
        amount={currentPayment.amount}
        currency={currentPayment.currency}
        courseId={courseId || undefined}
      />
    </Container>
  );
};

export default PaymentSuccessPage;
