/**
 * Quiz Redux slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { quizService } from '../../services/quiz.service';
import { QuizState, QuizSubmission } from '../../types/quiz.types';

const initialState: QuizState = {
  currentQuiz: null,
  quizResults: [],
  currentResult: null,
  quizStatistics: null,
  isLoading: false,
  error: null,
  timeRemaining: null,
  isTimerActive: false,
};

// Async thunks
export const fetchQuiz = createAsyncThunk(
  'quiz/fetchQuiz',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await quizService.getQuiz(id);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const submitQuiz = createAsyncThunk(
  'quiz/submitQuiz',
  async ({ quizId, submission }: { quizId: string; submission: QuizSubmission }, { rejectWithValue }) => {
    try {
      const response = await quizService.submitQuiz(quizId, submission);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchQuizResults = createAsyncThunk(
  'quiz/fetchQuizResults',
  async (quizId: string, { rejectWithValue }) => {
    try {
      const response = await quizService.getQuizResults(quizId);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentQuiz: (state) => {
      state.currentQuiz = null;
      state.timeRemaining = null;
      state.isTimerActive = false;
    },
    clearCurrentResult: (state) => {
      state.currentResult = null;
      state.quizResults = [];
      state.quizStatistics = null;
    },
    startTimer: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload * 60; // Convert minutes to seconds
      state.isTimerActive = true;
    },
    stopTimer: (state) => {
      state.isTimerActive = false;
    },
    decrementTimer: (state) => {
      if (state.timeRemaining !== null && state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
      if (state.timeRemaining === 0) {
        state.isTimerActive = false;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch quiz
    builder
      .addCase(fetchQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuiz = action.payload;
        state.timeRemaining = action.payload.duration * 60;
        state.isTimerActive = true;
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Submit quiz
    builder
      .addCase(submitQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentResult = action.payload;
        state.isTimerActive = false;
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch quiz results
    builder
      .addCase(fetchQuizResults.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizResults = action.payload.results;
        state.currentResult = action.payload.results[0] || null;
        state.quizStatistics = action.payload.statistics || null;
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentQuiz,
  clearCurrentResult,
  startTimer,
  stopTimer,
  decrementTimer,
} = quizSlice.actions;

export default quizSlice.reducer;
