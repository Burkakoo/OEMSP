/**
 * PaymentHistory component - Displays user's payment history
 */

import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchPaymentHistory } from '../../store/slices/paymentSlice';

const PaymentHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { payments, isLoading, error } = useSelector((state: RootState) => state.payment);

  useEffect(() => {
    dispatch(fetchPaymentHistory());
  }, [dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (payments.length === 0) {
    return (
      <Alert severity="info">
        No payment history found
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Transaction ID</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Payment Method</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment._id}>
              <TableCell>
                {new Date(payment.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>{payment.transactionId}</TableCell>
              <TableCell>
                {payment.amount} {payment.currency}
              </TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>
                {payment.paymentMethod.replace('-', ' ')}
              </TableCell>
              <TableCell>
                <Chip
                  label={payment.status}
                  color={getStatusColor(payment.status)}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PaymentHistory;
