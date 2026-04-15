/**
 * PaymentSuccessPage - Payment success confirmation page
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, CircularProgress, Box, Alert } from '@mui/material';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchPayment } from '../store/slices/paymentSlice';
import PaymentSuccess from '../components/payment/PaymentSuccess';
import { enrollmentService } from '@/services/enrollment.service';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { currentPayment, isLoading, error } = useSelector(
    (state: RootState) => state.payment
  );
  const [enrollmentMessage, setEnrollmentMessage] = useState<string | null>(null);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const paymentId = searchParams.get('paymentId');
  const courseId = searchParams.get('courseId');
  const payment = currentPayment?._id === paymentId ? currentPayment : null;

  useEffect(() => {
    if (paymentId) {
      dispatch(fetchPayment(paymentId));
    }
  }, [paymentId, dispatch]);

  useEffect(() => {
    const completeEnrollment = async () => {
      if (!paymentId || !courseId || !payment || payment.status !== 'completed') {
        return;
      }

      setEnrollmentError(null);
      try {
        await enrollmentService.createEnrollment(courseId, paymentId);
        setEnrollmentMessage('Enrollment completed. You can start the course now.');
      } catch (enrollError) {
        const message = (enrollError as Error).message || 'Failed to complete enrollment';
        if (message.toLowerCase().includes('already enrolled')) {
          setEnrollmentMessage('Enrollment already exists for this course.');
          return;
        }
        setEnrollmentError(message);
      }
    };

    void completeEnrollment();
  }, [courseId, payment, paymentId]);

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

  if (!payment) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="info">Payment information not found</Alert>
      </Container>
    );
  }

  if (payment.status === 'pending') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="info">
          This payment is still waiting for confirmation. Please finish the M-Pesa prompt on your phone.
        </Alert>
      </Container>
    );
  }

  if (payment.status === 'failed') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">This payment did not complete successfully.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      {enrollmentMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {enrollmentMessage}
        </Alert>
      )}
      {enrollmentError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Payment succeeded, but enrollment still needs attention: {enrollmentError}
        </Alert>
      )}
      <PaymentSuccess
        transactionId={payment.transactionId}
        amount={payment.amount}
        currency={payment.currency}
        courseId={courseId || undefined}
      />
    </Container>
  );
};

export default PaymentSuccessPage;
