/**
 * Enrollment Redux slice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { enrollmentService } from '../../services/enrollment.service';
import { EnrollmentState, UpdateProgressData } from '../../types/enrollment.types';

const initialState: EnrollmentState = {
  enrollments: [],
  currentEnrollment: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchEnrollments = createAsyncThunk(
  'enrollments/fetchEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await enrollmentService.getEnrollments();
      return response.data.enrollments;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchEnrollment = createAsyncThunk(
  'enrollments/fetchEnrollment',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await enrollmentService.getEnrollment(id);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createEnrollment = createAsyncThunk(
  'enrollments/createEnrollment',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const response = await enrollmentService.createEnrollment(courseId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateProgress = createAsyncThunk(
  'enrollments/updateProgress',
  async (
    { enrollmentId, data }: { enrollmentId: string; data: UpdateProgressData },
    { rejectWithValue }
  ) => {
    try {
      const response = await enrollmentService.updateProgress(enrollmentId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEnrollment: (state) => {
      state.currentEnrollment = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch enrollments
    builder
      .addCase(fetchEnrollments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEnrollments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enrollments = action.payload;
      })
      .addCase(fetchEnrollments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single enrollment
    builder
      .addCase(fetchEnrollment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEnrollment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEnrollment = action.payload;
      })
      .addCase(fetchEnrollment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create enrollment
    builder
      .addCase(createEnrollment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEnrollment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enrollments.unshift(action.payload);
        state.currentEnrollment = action.payload;
      })
      .addCase(createEnrollment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update progress
    builder
      .addCase(updateProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.enrollments.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) {
          state.enrollments[index] = action.payload;
        }
        if (state.currentEnrollment?._id === action.payload._id) {
          state.currentEnrollment = action.payload;
        }
      })
      .addCase(updateProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentEnrollment } = enrollmentSlice.actions;
export default enrollmentSlice.reducer;
