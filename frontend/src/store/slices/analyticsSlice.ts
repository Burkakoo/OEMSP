/**
 * Analytics Redux Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import analyticsService, {
  InstructorAnalytics,
  StudentAnalytics,
  AdminAnalytics,
} from '../../services/analytics.service';

interface AnalyticsState {
  instructorData: InstructorAnalytics | null;
  studentData: StudentAnalytics | null;
  adminData: AdminAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  instructorData: null,
  studentData: null,
  adminData: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchInstructorAnalytics = createAsyncThunk(
  'analytics/fetchInstructorAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await analyticsService.getInstructorAnalytics();
      return data;
    } catch (error: any) {
      return rejectWithValue((error as Error).message || 'Failed to fetch instructor analytics');
    }
  }
);

export const fetchStudentAnalytics = createAsyncThunk(
  'analytics/fetchStudentAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await analyticsService.getStudentAnalytics();
      return data;
    } catch (error: any) {
      return rejectWithValue((error as Error).message || 'Failed to fetch student analytics');
    }
  }
);

export const fetchAdminAnalytics = createAsyncThunk(
  'analytics/fetchAdminAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await analyticsService.getAdminAnalytics();
      return data;
    } catch (error: any) {
      return rejectWithValue((error as Error).message || 'Failed to fetch admin analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.instructorData = null;
      state.studentData = null;
      state.adminData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Instructor analytics
    builder
      .addCase(fetchInstructorAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInstructorAnalytics.fulfilled, (state, action: PayloadAction<InstructorAnalytics>) => {
        state.isLoading = false;
        state.instructorData = action.payload;
      })
      .addCase(fetchInstructorAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Student analytics
    builder
      .addCase(fetchStudentAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentAnalytics.fulfilled, (state, action: PayloadAction<StudentAnalytics>) => {
        state.isLoading = false;
        state.studentData = action.payload;
      })
      .addCase(fetchStudentAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Admin analytics
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action: PayloadAction<AdminAnalytics>) => {
        state.isLoading = false;
        state.adminData = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
