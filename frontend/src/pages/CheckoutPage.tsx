/**
 * CheckoutPage - Course checkout and payment page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchCourse, clearCurrentCourse } from '@store/slices/courseSlice';
import PaymentForm from '../components/payment/PaymentForm';
import { enrollmentService } from '@/services/enrollment.service';

const CheckoutPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCourse, isLoading } = useAppSelector((state) => state.courses);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourse(courseId));
    }

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [dispatch, courseId]);

  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (!courseId) return;

      try {
        const response = await enrollmentService.getEnrollments({
          courseId,
          page: 1,
          limit: 1,
        });
        setIsEnrolled(response.data.enrollments.length > 0);
      } catch (error) {
        console.error('Failed to check enrollment status:', error);
        setIsEnrolled(false);
      }
    };

    checkEnrollmentStatus();
  }, [courseId]);

  const handleFreeEnrollment = async () => {
    if (!currentCourse) return;
    
    setIsEnrolling(true);
    try {
      const result = await enrollmentService.enrollInFreeCourse(courseId!);
      void result;
      alert('Successfully enrolled in free course!');
      navigate(`/student/dashboard`);
    } catch (error: any) {
      setError(error.message || 'Failed to enroll in free course');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    navigate(`/payment/success?paymentId=${paymentId}&courseId=${courseId}`);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleGoToCourse = () => {
    navigate(`/courses/${courseId}/learn`);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!currentCourse) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Course not found
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Checkout
      </Typography>

      {isEnrolled ? (
        // Already enrolled - show go to course button
        <Grid container spacing={3}>
          <Grid>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Already Enrolled
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                You are already enrolled in this course. You can continue learning right away!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Course: {currentCourse.title}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleGoToCourse}
                sx={{ minWidth: 200 }}
              >
                Go to Course
              </Button>
            </Paper>
          </Grid>
        </Grid>
      ) : currentCourse && (currentCourse.isFree || currentCourse.price === 0) ? (
        // Free Course Enrollment
        <Grid container spacing={3}>
          <Grid>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Free Course Enrollment
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                This course is completely free! You can enroll immediately without any payment.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Course: {currentCourse.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Instructor: {currentCourse.instructor?.firstName} {currentCourse.instructor?.lastName}
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              <Button
                variant="contained"
                size="large"
                onClick={handleFreeEnrollment}
                disabled={isEnrolling}
                sx={{ minWidth: 200 }}
              >
                {isEnrolling ? <CircularProgress size={24} /> : 'Enroll Now'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Paid Course Payment Flow
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              {courseId && currentCourse && (
                <PaymentForm
                  courseId={courseId}
                  amount={currentCourse.price}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">
                  {currentCourse.price} {currentCourse.currency || 'ETB'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Tax</Typography>
                <Typography variant="body2">0 {currentCourse.currency || 'ETB'}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">
                  {currentCourse.price} {currentCourse.currency || 'ETB'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default CheckoutPage;
