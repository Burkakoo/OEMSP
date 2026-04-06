import { ILesson } from '../models/Course';

export interface LessonAvailability {
  isLocked: boolean;
  availableAt?: Date;
}

export const getLessonAvailability = (
  lesson: Pick<ILesson, 'isDripEnabled' | 'dripDelayDays'>,
  enrolledAt?: Date | string | null,
  now: Date = new Date()
): LessonAvailability => {
  if (!lesson.isDripEnabled || !lesson.dripDelayDays || lesson.dripDelayDays <= 0) {
    return { isLocked: false };
  }

  if (!enrolledAt) {
    return { isLocked: false };
  }

  const enrollmentDate = new Date(enrolledAt);
  const availableAt = new Date(enrollmentDate);
  availableAt.setUTCDate(availableAt.getUTCDate() + lesson.dripDelayDays);

  return {
    isLocked: availableAt > now,
    availableAt,
  };
};
