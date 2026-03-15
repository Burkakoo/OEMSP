/**
 * Payment Redux slice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentService } from '../../services/payment.service';
import { PaymentState, ProcessPaymentData } from '../../types/payment.types';

const initialState: PaymentState = {
  payments: [],
  currentPayment: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (paymentData: ProcessPaymentData, { rejectWithValue }) => {
    try {
      const response = await paymentService.processPayment(paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchPaymentHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentHistory();
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPayment = createAsyncThunk(
  'payment/fetchPayment',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPayment(id);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
  },
  extraReducers: (builder) => {
    // Process payment
    builder
      .addCase(processPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPayment = action.payload;
        state.payments.unshift(action.payload);
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch payment history
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch payment
    builder
      .addCase(fetchPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPayment = action.payload;
      })
      .addCase(fetchPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentPayment } = paymentSlice.actions;

export default paymentSlice.reducer;
