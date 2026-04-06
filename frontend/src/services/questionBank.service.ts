import apiRequest from './api';
import {
  QuestionBankItem,
  QuestionBankItemFormData,
} from '@/types/questionBank.types';

interface QuestionBankListResponse {
  success: boolean;
  data: QuestionBankItem[];
}

interface QuestionBankItemResponse {
  success: boolean;
  data: QuestionBankItem;
}

export const questionBankService = {
  getCourseQuestionBank: async (
    courseId: string,
    options?: { includeInactive?: boolean }
  ): Promise<QuestionBankListResponse> => {
    const params = new URLSearchParams();
    if (options?.includeInactive) {
      params.append('includeInactive', 'true');
    }

    const query = params.toString();
    return apiRequest<QuestionBankListResponse>(
      `/question-bank/course/${courseId}${query ? `?${query}` : ''}`
    );
  },

  createQuestionBankItem: async (
    courseId: string,
    data: QuestionBankItemFormData
  ): Promise<QuestionBankItemResponse> => {
    return apiRequest<QuestionBankItemResponse>(`/question-bank/course/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateQuestionBankItem: async (
    itemId: string,
    data: QuestionBankItemFormData
  ): Promise<QuestionBankItemResponse> => {
    return apiRequest<QuestionBankItemResponse>(`/question-bank/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteQuestionBankItem: async (
    itemId: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/question-bank/${itemId}`, {
      method: 'DELETE',
    });
  },
};
