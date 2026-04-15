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
  TextField,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchCourse, clearCurrentCourse } from '@store/slices/courseSlice';
import PaymentForm from '../components/payment/PaymentForm';
import { enrollmentService } from '@/services/enrollment.service';
import { paymentService } from '@/services/payment.service';
import { Payment, PaymentQuote } from '@/types/payment.types';
import { useLocalization } from '@/context/LocalizationContext';

const CheckoutPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCourse, isLoading } = useAppSelector((state) => state.courses);
  const { formatCurrency, t } = useLocalization();
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);
  const [pricingQuote, setPricingQuote] = useState<PaymentQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null);

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

  const loadPricingQuote = async (nextCouponCode?: string): Promise<boolean> => {
    if (!courseId || !currentCourse || currentCourse.isFree) {
      return false;
    }

    setIsQuoteLoading(true);
    setQuoteError(null);

    try {
      const response = await paymentService.getPaymentQuote({
        courseId,
        couponCode: nextCouponCode,
      });
      setPricingQuote(response.data);
      return true;
    } catch (quoteLoadError) {
      setPricingQuote(null);
      setQuoteError((quoteLoadError as Error).message || 'Failed to load checkout pricing');
      return false;
    } finally {
      setIsQuoteLoading(false);
    }
  };

  useEffect(() => {
    if (currentCourse && !currentCourse.isFree && courseId) {
      void loadPricingQuote(appliedCouponCode);
    }
  }, [courseId, currentCourse]);

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

  const handlePaymentSuccess = (payment: Payment) => {
    setError(null);

    if (payment.status === 'pending') {
      navigate(`/payment/pending?paymentId=${payment._id}&courseId=${courseId}`);
      return;
    }

    navigate(`/payment/success?paymentId=${payment._id}&courseId=${courseId}`);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleApplyCoupon = async () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    setQuoteSuccess(null);

    if (!normalizedCode) {
      setAppliedCouponCode(undefined);
      setQuoteError(null);
      await loadPricingQuote(undefined);
      return;
    }

    setAppliedCouponCode(normalizedCode);
    const applied = await loadPricingQuote(normalizedCode);
    if (applied) {
      setQuoteSuccess(`Coupon ${normalizedCode} applied.`);
    }
  };

  const orderSummary = pricingQuote ?? (currentCourse
    ? {
        courseId: currentCourse._id,
        courseTitle: currentCourse.title,
        currency: currentCourse.currency,
        basePrice: currentCourse.price,
        saleDiscountAmount: currentCourse.saleDiscountAmount,
        currentPrice: currentCourse.currentPrice,
        couponDiscountAmount: 0,
        finalPrice: currentCourse.currentPrice,
        hasActiveSale: currentCourse.hasActiveSale,
        appliedCoupon: undefined,
      }
    : null);

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
        {t('checkout')}
      </Typography>

      {isEnrolled ? (
        // Already enrolled - show go to course button
        <Grid container spacing={3}>
          <Grid>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {t('alreadyEnrolled')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {t('alreadyEnrolledMessage')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('courseLabel')}: {currentCourse.title}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleGoToCourse}
                sx={{ minWidth: 200 }}
              >
                {t('goToCourse')}
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
                {t('freeCourseEnrollment')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {t('freeCourseMessage')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('courseLabel')}: {currentCourse.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('instructorLabel')}: {currentCourse.instructor?.firstName} {currentCourse.instructor?.lastName}
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
                {isEnrolling ? <CircularProgress size={24} /> : t('enrollNow')}
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
                {t('paymentInformation')}
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
                <TextField
                  fullWidth
                  label={t('couponCode')}
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  disabled={isQuoteLoading}
                />
                <Button variant="outlined" onClick={handleApplyCoupon} disabled={isQuoteLoading}>
                  {t('apply')}
                </Button>
              </Box>
              {quoteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {quoteError}
                </Alert>
              )}
              {quoteSuccess && !quoteError && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {quoteSuccess}
                </Alert>
              )}
              {courseId && currentCourse && (
                <PaymentForm
                  courseId={courseId}
                  amount={orderSummary?.finalPrice ?? currentCourse.currentPrice}
                  currency={orderSummary?.currency ?? currentCourse.currency}
                  couponCode={orderSummary?.appliedCoupon?.code}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('orderSummary')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{t('subtotal')}</Typography>
                <Typography variant="body2">
                  {orderSummary
                    ? formatCurrency(orderSummary.basePrice, orderSummary.currency)
                    : formatCurrency(currentCourse.price, currentCourse.currency || 'ETB')}
                </Typography>
              </Box>

              {Boolean(orderSummary?.saleDiscountAmount) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{t('saleDiscount')}</Typography>
                  <Typography variant="body2" color="success.main">
                    -{formatCurrency(
                      orderSummary?.saleDiscountAmount ?? 0,
                      orderSummary?.currency ?? (currentCourse.currency || 'ETB')
                    )}
                  </Typography>
                </Box>
              )}

              {Boolean(orderSummary?.couponDiscountAmount) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Coupon {orderSummary?.appliedCoupon?.code}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -{formatCurrency(
                      orderSummary?.couponDiscountAmount ?? 0,
                      orderSummary?.currency ?? (currentCourse.currency || 'ETB')
                    )}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">{t('tax')}</Typography>
                <Typography variant="body2">
                  {formatCurrency(0, orderSummary?.currency ?? (currentCourse.currency || 'ETB'))}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">{t('total')}</Typography>
                <Typography variant="h6">
                  {orderSummary
                    ? formatCurrency(orderSummary.finalPrice, orderSummary.currency)
                    : formatCurrency(currentCourse.currentPrice, currentCourse.currency || 'ETB')}
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
