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

  useEffect(() => {
    if (paymentId) {
      dispatch(fetchPayment(paymentId));
    }
  }, [paymentId, dispatch]);

  useEffect(() => {
    const completeEnrollment = async () => {
      if (!paymentId || !courseId || !currentPayment) {
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
  }, [courseId, currentPayment, paymentId]);

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
        transactionId={currentPayment.transactionId}
        amount={currentPayment.amount}
        currency={currentPayment.currency}
        courseId={courseId || undefined}
      />
    </Container>
  );
};

export default PaymentSuccessPage;
