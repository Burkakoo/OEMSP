import { QuestionType } from './quiz.types';

export interface QuestionBankItem {
  id: string;
  courseId: string;
  createdBy: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankItemFormData {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  tags?: string[];
  isActive?: boolean;
}
