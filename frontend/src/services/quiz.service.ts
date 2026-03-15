/**
 * Quiz API service
 */

import apiRequest from './api';
import { Quiz, QuizQuestion, QuizSubmission, QuizResult, QuizStatistics } from '../types/quiz.types';

interface QuizResponse {
  success: boolean;
  data: Quiz;
}

interface QuizResultResponse {
  success: boolean;
  data: QuizResult;
}

interface QuizResultsResponse {
  success: boolean;
  data: {
    results: QuizResult[];
    statistics?: QuizStatistics;
  };
}

interface QuizStatisticsResponse {
  success: boolean;
  data: QuizStatistics;
}

interface QuestionResponse {
  success: boolean;
  data: QuizQuestion;
}

export const quizService = {
  getQuiz: async (id: string): Promise<QuizResponse> => {
    return apiRequest<QuizResponse>(`/quizzes/${id}`);
  },

  submitQuiz: async (quizId: string, submission: QuizSubmission): Promise<QuizResultResponse> => {
    return apiRequest<QuizResultResponse>(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  },

  getQuizResults: async (quizId: string, studentId?: string): Promise<QuizResultsResponse> => {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);

    const query = params.toString();
    return apiRequest<QuizResultsResponse>(`/quizzes/${quizId}/results${query ? `?${query}` : ''}`);
  },

  createQuiz: async (courseId: string, quizData: Partial<Quiz>): Promise<QuizResponse> => {
    return apiRequest<QuizResponse>(`/courses/${courseId}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
  },

  updateQuiz: async (quizId: string, quizData: Partial<Quiz>): Promise<QuizResponse> => {
    return apiRequest<QuizResponse>(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(quizData),
    });
  },

  deleteQuiz: async (quizId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/quizzes/${quizId}`, {
      method: 'DELETE',
    });
  },

  addQuestion: async (quizId: string, question: Partial<QuizQuestion>): Promise<QuestionResponse> => {
    return apiRequest<QuestionResponse>(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(question),
    });
  },

  updateQuestion: async (questionId: string, updates: Partial<QuizQuestion>): Promise<QuestionResponse> => {
    return apiRequest<QuestionResponse>(`/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteQuestion: async (questionId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  getQuizStatistics: async (quizId: string): Promise<QuizStatisticsResponse> => {
    return apiRequest<QuizStatisticsResponse>(`/quizzes/${quizId}/statistics`);
  },
};
