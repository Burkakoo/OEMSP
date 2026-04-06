import mongoose from 'mongoose';
import Course from '../models/Course';
import QuestionBankItem, { IQuestionBankItem } from '../models/QuestionBankItem';
import { UserRole } from '../models/User';
import { QuestionType } from '../models/Quiz';
import { normalizeQuestionInput, validateQuestion } from '../utils/question.utils';

export interface QuestionBankItemDTO {
  id: string;
  courseId: string;
  createdBy: string;
  type: string;
  text: string;
  options: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionBankPayload {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  tags?: string[];
  isActive?: boolean;
}

const ensureValidObjectId = (value: string, label: string): void => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
};

const mapQuestionBankItem = (item: IQuestionBankItem): QuestionBankItemDTO => ({
  id: item._id.toString(),
  courseId: item.courseId.toString(),
  createdBy: item.createdBy.toString(),
  type: item.type,
  text: item.text,
  options: item.options,
  correctAnswer: item.correctAnswer,
  points: item.points,
  explanation: item.explanation,
  tags: item.tags,
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const normalizeTags = (tags?: string[]): string[] =>
  Array.isArray(tags)
    ? Array.from(
        new Set(
          tags
            .map((tag) => String(tag).trim())
            .filter(Boolean)
        )
      )
    : [];

const ensureCourseAccess = async (
  courseId: string,
  requesterId: string,
  requesterRole: UserRole | string
): Promise<void> => {
  ensureValidObjectId(courseId, 'course ID');
  ensureValidObjectId(requesterId, 'requester ID');

  const course = await Course.findById(courseId).select('instructorId');
  if (!course) {
    throw new Error('Course not found');
  }

  if (requesterRole === UserRole.ADMIN) {
    return;
  }

  if (requesterRole !== UserRole.INSTRUCTOR || course.instructorId.toString() !== requesterId) {
    throw new Error('Access denied');
  }
};

const buildItemPayload = (payload: QuestionBankPayload) => {
  const normalizedPayload = normalizeQuestionInput(payload);
  const validation = validateQuestion(normalizedPayload);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  return {
    type: normalizedPayload.type,
    text: normalizedPayload.text,
    options: normalizedPayload.options ?? [],
    correctAnswer: normalizedPayload.correctAnswer,
    points: normalizedPayload.points,
    explanation: normalizedPayload.explanation?.trim() || undefined,
    tags: normalizeTags(payload.tags),
    isActive: payload.isActive ?? true,
  };
};

export const listQuestionBankItems = async (params: {
  courseId: string;
  requesterId: string;
  requesterRole: UserRole | string;
  includeInactive?: boolean;
}): Promise<QuestionBankItemDTO[]> => {
  await ensureCourseAccess(params.courseId, params.requesterId, params.requesterRole);

  const query: any = { courseId: params.courseId };
  if (!params.includeInactive) {
    query.isActive = true;
  }

  const items = await QuestionBankItem.find(query).sort({ createdAt: -1 });
  return items.map(mapQuestionBankItem);
};

export const createQuestionBankItem = async (params: {
  courseId: string;
  requesterId: string;
  requesterRole: UserRole | string;
  payload: QuestionBankPayload;
}): Promise<QuestionBankItemDTO> => {
  await ensureCourseAccess(params.courseId, params.requesterId, params.requesterRole);

  const item = await QuestionBankItem.create({
    courseId: params.courseId,
    createdBy: params.requesterId,
    ...buildItemPayload(params.payload),
  });

  return mapQuestionBankItem(item);
};

export const updateQuestionBankItem = async (params: {
  itemId: string;
  requesterId: string;
  requesterRole: UserRole | string;
  payload: QuestionBankPayload;
}): Promise<QuestionBankItemDTO> => {
  ensureValidObjectId(params.itemId, 'question bank item ID');
  const item = await QuestionBankItem.findById(params.itemId);
  if (!item) {
    throw new Error('Question bank item not found');
  }

  await ensureCourseAccess(item.courseId.toString(), params.requesterId, params.requesterRole);

  Object.assign(item, buildItemPayload(params.payload));
  await item.save();

  return mapQuestionBankItem(item);
};

export const deleteQuestionBankItem = async (params: {
  itemId: string;
  requesterId: string;
  requesterRole: UserRole | string;
}): Promise<void> => {
  ensureValidObjectId(params.itemId, 'question bank item ID');
  const item = await QuestionBankItem.findById(params.itemId).select('courseId');
  if (!item) {
    throw new Error('Question bank item not found');
  }

  await ensureCourseAccess(item.courseId.toString(), params.requesterId, params.requesterRole);
  await QuestionBankItem.findByIdAndDelete(params.itemId);
};

export const getQuestionBankItemsByIds = async (params: {
  courseId: string;
  itemIds: string[];
}): Promise<IQuestionBankItem[]> => {
  ensureValidObjectId(params.courseId, 'course ID');

  const uniqueIds = Array.from(new Set(params.itemIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }

  uniqueIds.forEach((itemId) => ensureValidObjectId(itemId, 'question bank item ID'));

  const items = await QuestionBankItem.find({
    _id: { $in: uniqueIds },
    courseId: params.courseId,
    isActive: true,
  });

  return items;
};
