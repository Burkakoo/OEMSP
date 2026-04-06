import { IQuestion, QuestionType } from '../models/Quiz';

type QuestionLike = Partial<
  Pick<IQuestion, 'type' | 'text' | 'options' | 'correctAnswer' | 'points' | 'explanation'>
>;

export const normalizeQuestionInput = <T extends QuestionLike>(question: T): T => {
  const normalizedQuestion = { ...question } as T;

  if (typeof normalizedQuestion.text === 'string') {
    normalizedQuestion.text = normalizedQuestion.text.trim() as T['text'];
  }

  if (Array.isArray(normalizedQuestion.options)) {
    normalizedQuestion.options = normalizedQuestion.options
      .map((option) => String(option).trim())
      .filter(Boolean) as T['options'];
  }

  if (typeof normalizedQuestion.correctAnswer === 'string') {
    normalizedQuestion.correctAnswer = normalizedQuestion.correctAnswer.trim() as T['correctAnswer'];
  }

  if (Array.isArray(normalizedQuestion.correctAnswer)) {
    normalizedQuestion.correctAnswer = normalizedQuestion.correctAnswer
      .map((answer) => String(answer).trim())
      .filter(Boolean) as T['correctAnswer'];
  }

  if (typeof normalizedQuestion.explanation === 'string') {
    normalizedQuestion.explanation = normalizedQuestion.explanation.trim() as T['explanation'];
  }

  return normalizedQuestion;
};

export const validateQuestion = (question: QuestionLike): { valid: boolean; errors: string[] } => {
  const normalizedQuestion = normalizeQuestionInput(question);
  const errors: string[] = [];

  if (!normalizedQuestion.type) {
    errors.push('Question type is required');
    return { valid: false, errors };
  }

  if (!normalizedQuestion.text || normalizedQuestion.text.length < 5) {
    errors.push('Question text must be at least 5 characters');
  }

  if (!normalizedQuestion.points || normalizedQuestion.points <= 0) {
    errors.push('Question points must be greater than 0');
  }

  switch (normalizedQuestion.type) {
    case QuestionType.MULTIPLE_CHOICE:
      if (
        !normalizedQuestion.options ||
        normalizedQuestion.options.length < 2 ||
        normalizedQuestion.options.length > 6
      ) {
        errors.push('Multiple choice questions must have 2-6 options');
      }
      if (typeof normalizedQuestion.correctAnswer !== 'string') {
        errors.push('Multiple choice correct answer must be a string');
      }
      if (
        typeof normalizedQuestion.correctAnswer === 'string' &&
        normalizedQuestion.options &&
        !normalizedQuestion.options.includes(normalizedQuestion.correctAnswer)
      ) {
        errors.push('Correct answer must match one of the options');
      }
      break;

    case QuestionType.TRUE_FALSE:
      if (
        normalizedQuestion.options &&
        normalizedQuestion.options.length > 0 &&
        normalizedQuestion.options.length !== 2
      ) {
        errors.push('True/false questions must have 0 or 2 options');
      }
      if (typeof normalizedQuestion.correctAnswer !== 'string') {
        errors.push('True/false correct answer must be a string');
      }
      break;

    case QuestionType.MULTI_SELECT:
      if (
        !normalizedQuestion.options ||
        normalizedQuestion.options.length < 2 ||
        normalizedQuestion.options.length > 6
      ) {
        errors.push('Multi-select questions must have 2-6 options');
      }
      if (
        !Array.isArray(normalizedQuestion.correctAnswer) ||
        normalizedQuestion.correctAnswer.length === 0
      ) {
        errors.push('Multi-select correct answer must be a non-empty array');
      }
      if (
        Array.isArray(normalizedQuestion.correctAnswer) &&
        normalizedQuestion.options &&
        normalizedQuestion.correctAnswer.some((answer) => !normalizedQuestion.options!.includes(answer))
      ) {
        errors.push('All correct answers must match one of the options');
      }
      break;

    case QuestionType.SHORT_ANSWER:
      if (normalizedQuestion.options && normalizedQuestion.options.length > 0) {
        errors.push('Short answer questions should not have options');
      }
      if (typeof normalizedQuestion.correctAnswer !== 'string') {
        errors.push('Short answer correct answer must be a string');
      }
      break;

    default:
      errors.push('Invalid question type');
  }

  return { valid: errors.length === 0, errors };
};
