import { Lesson } from '@/types/course.types';

export interface LessonAvailability {
  isLocked: boolean;
  availableAt?: Date;
}

export const getLessonAvailability = (
  lesson: Pick<Lesson, 'isDripEnabled' | 'dripDelayDays'>,
  enrolledAt?: string | null,
  now: Date = new Date()
): LessonAvailability => {
  if (!lesson.isDripEnabled || !lesson.dripDelayDays || lesson.dripDelayDays <= 0) {
    return { isLocked: false };
  }

  if (!enrolledAt) {
    return { isLocked: false };
  }

  const availableAt = new Date(enrolledAt);
  availableAt.setUTCDate(availableAt.getUTCDate() + lesson.dripDelayDays);

  return {
    isLocked: availableAt > now,
    availableAt,
  };
};

export const formatLessonAvailabilityLabel = (
  lesson: Pick<Lesson, 'isDripEnabled' | 'dripDelayDays'>,
  enrolledAt?: string | null
): string | undefined => {
  if (!lesson.isDripEnabled || !lesson.dripDelayDays || lesson.dripDelayDays <= 0) {
    return undefined;
  }

  const availability = getLessonAvailability(lesson, enrolledAt);
  if (!availability.availableAt) {
    return `Unlocks after ${lesson.dripDelayDays} day(s)`;
  }

  if (availability.isLocked) {
    return `Unlocks ${availability.availableAt.toLocaleDateString()}`;
  }

  return `Released after ${lesson.dripDelayDays} day(s)`;
};
