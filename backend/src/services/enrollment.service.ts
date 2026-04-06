import mongoose from 'mongoose';
import Enrollment, { IEnrollment, ILessonProgress } from '../models/Enrollment';
import Course from '../models/Course';
import Certificate from '../models/Certificate';
import Payment from '../models/Payment';
import { getCache, setCache, deleteCache, invalidateByPattern } from '../utils/cache.utils';
import * as certificateService from './certificate.service';
import { getLessonAvailability } from '../utils/lesson-access.utils';

const CACHE_TTL = 300; // 5 minutes

const invalidateStudentEnrollmentListCache = async (studentId: string): Promise<void> => {
  await invalidateByPattern(`enrollments:student:${studentId}:*`);
  // Backward compatibility if any old non-paginated key exists
  await deleteCache(`enrollments:student:${studentId}`);
};

/**
 * Enrollment Service
 * Handles all enrollment-related business logic
 */

/**
 * Create a new enrollment for a student
 */
export const enrollStudent = async (
  studentId: string,
  courseId: string,
  paymentId: string
): Promise<IEnrollment> => {
  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid student ID');
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error('Invalid course ID');
  }
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment ID');
  }

  // Check if course exists and is published
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  if (!course.isPublished) {
    throw new Error('Cannot enroll in unpublished course');
  }

  // Check if payment exists and is successful
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }
  if (payment.status !== 'completed') {
    throw new Error('Payment not completed');
  }
  if (payment.userId.toString() !== studentId) {
    throw new Error('Payment does not belong to this student');
  }
  if (payment.courseId.toString() !== courseId) {
    throw new Error('Payment is not for this course');
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
  if (existingEnrollment) {
    throw new Error('Student is already enrolled in this course');
  }

  // Initialize progress array with all lessons
  const progress: ILessonProgress[] = [];
  course.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      progress.push({
        lessonId: lesson._id,
        completed: false,
        timeSpent: 0,
      });
    });
  });

  // Create enrollment
  const enrollment = await Enrollment.create({
    studentId,
    courseId,
    paymentId,
    progress,
    completionPercentage: 0,
    isCompleted: false,
  });

  // Increment enrollment count on course
  await Course.findByIdAndUpdate(courseId, {
    $inc: { enrollmentCount: 1 },
  });

  // Invalidate caches
  await deleteCache(`enrollment:${enrollment._id}`);
  await invalidateStudentEnrollmentListCache(studentId);
  await deleteCache(`enrollments:course:${courseId}`);

  return enrollment;
};

/**
 * Enroll student in free course without payment
 */
export const enrollInFreeCourse = async (
  studentId: string,
  courseId: string
): Promise<IEnrollment> => {
  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid student ID');
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error('Invalid course ID');
  }

  // Check if course exists, is published, and is free
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  if (!course.isPublished) {
    throw new Error('Cannot enroll in unpublished course');
  }
  if (!course.isFree) {
    throw new Error('This is not a free course');
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
  if (existingEnrollment) {
    throw new Error('Student is already enrolled in this course');
  }

  // Initialize progress array with all lessons
  const progress: ILessonProgress[] = [];
  course.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      progress.push({
        lessonId: lesson._id,
        completed: false,
        timeSpent: 0,
      });
    });
  });

  // Create enrollment without payment
  const enrollment = await Enrollment.create({
    studentId,
    courseId,
    progress,
    completionPercentage: 0,
    isCompleted: false,
  });

  // Increment enrollment count on course
  await Course.findByIdAndUpdate(courseId, {
    $inc: { enrollmentCount: 1 },
  });

  // Invalidate caches
  await deleteCache(`enrollment:${enrollment._id}`);
  await invalidateStudentEnrollmentListCache(studentId);
  await deleteCache(`enrollments:course:${courseId}`);

  return enrollment;
};

/**
 * Get enrollment by ID
 */
export const getEnrollment = async (enrollmentId: string): Promise<IEnrollment | null> => {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new Error('Invalid enrollment ID');
  }

  // Try cache first
  const cacheKey = `enrollment:${enrollmentId}`;
  const cached = await getCache<IEnrollment>(cacheKey);
  if (cached) {
    return cached;
  }

  const enrollment = await Enrollment.findById(enrollmentId)
    .populate('studentId', 'firstName lastName email')
    .populate('courseId', 'title description instructorId thumbnail')
    .populate('paymentId', 'amount status transactionId');

  if (enrollment) {
    await setCache(cacheKey, enrollment, CACHE_TTL);
  }

  return enrollment;
};

/**
 * List enrollments with filters
 */
export const listEnrollments = async (filters: {
  studentId?: string;
  courseId?: string;
  instructorId?: string;
  isCompleted?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ enrollments: IEnrollment[]; total: number; page: number; pages: number }> => {
  const { studentId, courseId, instructorId, isCompleted, page = 1, limit = 10 } = filters;

  // Build query
  const query: any = {};
  if (studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error('Invalid student ID');
    }
    query.studentId = studentId;
  }
  if (courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID');
    }
    query.courseId = courseId;
  }
  if (instructorId) {
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      throw new Error('Invalid instructor ID');
    }

    const ownedCourseIds = await Course.find({ instructorId }).distinct('_id');
    if (courseId) {
      const normalizedCourseId = String(courseId);
      const ownsRequestedCourse = ownedCourseIds.some(
        (ownedCourseId) => String(ownedCourseId) === normalizedCourseId
      );

      if (!ownsRequestedCourse) {
        throw new Error('Access denied');
      }
    } else {
      if (ownedCourseIds.length === 0) {
        return {
          enrollments: [],
          total: 0,
          page,
          pages: 0,
        };
      }

      query.courseId = { $in: ownedCourseIds };
    }
  }
  if (isCompleted !== undefined) {
    query.isCompleted = isCompleted;
  }

  // Try cache for student-specific queries
  if (studentId && !courseId && isCompleted === undefined) {
    const cacheKey = `enrollments:student:${studentId}:${page}:${limit}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Execute query
  const skip = (page - 1) * limit;
  const [enrollments, total] = await Promise.all([
    Enrollment.find(query)
      .populate('studentId', 'firstName lastName email')
      .populate('courseId', 'title description instructorId thumbnail')
      .skip(skip)
      .limit(limit)
      .sort({ enrolledAt: -1 }),
    Enrollment.countDocuments(query),
  ]);

  // Self-heal legacy records where completion percentage drifted from lesson progress
  for (const enrollment of enrollments) {
    if (!enrollment.progress || enrollment.progress.length === 0) {
      continue;
    }

    const recalculatedPercentage = await calculateProgress(enrollment);
    const shouldMarkCompleted = recalculatedPercentage === 100 && !enrollment.isCompleted;
    const percentageChanged =
      Math.abs((enrollment.completionPercentage ?? 0) - recalculatedPercentage) > 0.001;

    if (!percentageChanged && !shouldMarkCompleted) {
      continue;
    }

    enrollment.completionPercentage = recalculatedPercentage;
    if (shouldMarkCompleted) {
      enrollment.isCompleted = true;
      enrollment.completedAt = enrollment.completedAt || new Date();
    }

    await enrollment.save();
    await deleteCache(`enrollment:${enrollment._id}`);
  }

  const result = {
    enrollments,
    total,
    page,
    pages: Math.ceil(total / limit),
  };

  // Cache student-specific queries
  if (studentId && !courseId && isCompleted === undefined) {
    const cacheKey = `enrollments:student:${studentId}:${page}:${limit}`;
    await setCache(cacheKey, result, CACHE_TTL);
  }

  return result;
};

/**
 * Update lesson progress for an enrollment
 */
export const updateProgress = async (
  enrollmentId: string,
  lessonId: string,
  completed: boolean,
  timeSpent: number
): Promise<IEnrollment> => {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new Error('Invalid enrollment ID');
  }
  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new Error('Invalid lesson ID');
  }
  if (timeSpent < 0) {
    throw new Error('Time spent cannot be negative');
  }

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const course = await Course.findById(enrollment.courseId).select(
    'modules.lessons._id modules.lessons.duration modules.lessons.isDripEnabled modules.lessons.dripDelayDays'
  );
  if (!course) {
    throw new Error('Course not found for enrollment');
  }

  const targetLesson = course.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson._id.toString() === lessonId);

  if (!targetLesson) {
    throw new Error('Lesson not found in course');
  }

  const availability = getLessonAvailability(targetLesson, enrollment.enrolledAt);
  if (availability.isLocked) {
    throw new Error('This lesson is not available yet because it is still on drip release');
  }

  // Find the lesson progress entry
  let lessonProgress = enrollment.progress.find(
    (p) => p.lessonId.toString() === lessonId
  );

  // Backfill legacy enrollments where progress array wasn't pre-seeded
  if (!lessonProgress) {
    const courseLessonIds = course.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson._id.toString())
    );
    const lessonExistsInCourse = courseLessonIds.includes(lessonId);

    if (!lessonExistsInCourse) {
      throw new Error('Lesson not found in course');
    }

    const existingProgressLessonIds = new Set(
      enrollment.progress.map((p) => p.lessonId.toString())
    );

    for (const courseLessonId of courseLessonIds) {
      if (existingProgressLessonIds.has(courseLessonId)) {
        continue;
      }
      enrollment.progress.push({
        lessonId: new mongoose.Types.ObjectId(courseLessonId),
        completed: false,
        timeSpent: 0,
      });
    }

    lessonProgress = enrollment.progress.find(
      (p) => p.lessonId.toString() === lessonId
    );
  }

  if (!lessonProgress) {
    throw new Error('Failed to initialize lesson progress');
  }

  // Update progress
  lessonProgress.completed = completed;
  lessonProgress.timeSpent = timeSpent;
  if (completed && !lessonProgress.completedAt) {
    lessonProgress.completedAt = new Date();
  }

  // Update last accessed timestamp
  enrollment.lastAccessedAt = new Date();

  // Recalculate completion percentage
  const completionPercentage = await calculateProgress(enrollment);
  enrollment.completionPercentage = completionPercentage;

  // Check if course is completed
  const wasCompleted = enrollment.isCompleted;
  const isNowCompleted = completionPercentage === 100;

  if (isNowCompleted) {
    if (!enrollment.isCompleted) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();
    }
  } else if (enrollment.isCompleted) {
    // If progress regressed, mark as incomplete and clear completedAt
    enrollment.isCompleted = false;
    enrollment.completedAt = undefined;
  }

  await enrollment.save();

  if (isNowCompleted && !wasCompleted) {
    try {
      const certificate = await certificateService.ensureCertificateForEnrollment(
        enrollment._id.toString()
      );
      const currentCertificateId = enrollment.certificateId?.toString();
      const generatedCertificateId = certificate._id.toString();

      if (currentCertificateId !== generatedCertificateId) {
        enrollment.certificateId = certificate._id as mongoose.Types.ObjectId;
        await enrollment.save();
      }
    } catch (error) {
      console.error(
        'Failed to auto-generate certificate after completion:',
        error
      );
      // Completion should still succeed even if certificate generation fails
    }
  }

  // Invalidate caches
  await deleteCache(`enrollment:${enrollmentId}`);
  await invalidateStudentEnrollmentListCache(enrollment.studentId.toString());

  return enrollment;
};

/**
 * Calculate completion percentage for an enrollment
 */
export const calculateProgress = async (enrollment: IEnrollment): Promise<number> => {
  if (!enrollment.progress || enrollment.progress.length === 0) {
    return 0;
  }

  const totalLessons = enrollment.progress.length;
  let totalProgress = 0;

  try {
    // Get course to access actual lesson durations
    const course = await Course.findById(enrollment.courseId).select('modules.lessons._id modules.lessons.duration');
    if (!course) {
      // Fallback to simple calculation if course not found
      return calculateProgressSimple(enrollment);
    }

    // Create a map of lessonId to duration
    const lessonDurationMap = new Map<string, number>();
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        lessonDurationMap.set(lesson._id.toString(), lesson.duration || 5); // Default 5 minutes if not set
      });
    });

    for (const progress of enrollment.progress) {
      const lessonId = progress.lessonId.toString();
      const durationMinutes = lessonDurationMap.get(lessonId) || 5;
      const durationSeconds = durationMinutes * 60;

      if (progress.completed) {
        // Completed lesson = 100% of its share
        totalProgress += 100 / totalLessons;
      } else if (progress.timeSpent > 0) {
        // Partial progress based on time spent vs duration
        const progressPercent = Math.min((progress.timeSpent / durationSeconds) * 100, 95); // Cap at 95% if not completed
        totalProgress += (progressPercent / 100) * (100 / totalLessons);
      }
      // If not completed and no time spent, contributes 0%
    }
  } catch (error) {
    console.error('Error calculating progress with durations:', error);
    // Fallback to simple calculation
    return calculateProgressSimple(enrollment);
  }

  return Math.round(totalProgress * 100) / 100; // Round to 2 decimal places
};

/**
 * Simple progress calculation (fallback)
 */
const calculateProgressSimple = (enrollment: IEnrollment): number => {
  const completedLessons = enrollment.progress.filter((p) => p.completed).length;
  const totalLessons = enrollment.progress.length;

  const percentage = (completedLessons / totalLessons) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
};

/**
 * Check if enrollment is completed
 */
export const checkCompletion = async (enrollmentId: string): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new Error('Invalid enrollment ID');
  }

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Check if all lessons are completed
  const allCompleted = enrollment.progress.every((p) => p.completed);

  let changed = false;

  if (allCompleted) {
    if (!enrollment.isCompleted) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();
      changed = true;
    }
    if (enrollment.completionPercentage !== 100) {
      enrollment.completionPercentage = 100;
      changed = true;
    }
  } else if (enrollment.isCompleted) {
    enrollment.isCompleted = false;
    enrollment.completedAt = undefined;
    changed = true;

    const recalculated = Math.round((enrollment.progress.filter((p) => p.completed).length / enrollment.progress.length) * 100 * 100) / 100;
    if (enrollment.completionPercentage !== recalculated) {
      enrollment.completionPercentage = recalculated;
    }
  } else {
    const recalculated = Math.round((enrollment.progress.filter((p) => p.completed).length / enrollment.progress.length) * 100 * 100) / 100;
    if (enrollment.completionPercentage !== recalculated) {
      enrollment.completionPercentage = recalculated;
      changed = true;
    }
  }

  if (changed) {
    await enrollment.save();
  }

  if (enrollment.isCompleted) {
    try {
      const certificate = await certificateService.ensureCertificateForEnrollment(
        enrollment._id.toString()
      );
      const currentCertificateId = enrollment.certificateId?.toString();
      const generatedCertificateId = certificate._id.toString();

      if (currentCertificateId !== generatedCertificateId) {
        enrollment.certificateId = certificate._id as mongoose.Types.ObjectId;
        await enrollment.save();
      }
    } catch (error) {
      console.error('Failed to generate certificate on completion check:', error);
      // Don't throw error here as completion is more important
    }
  }

  if (changed || enrollment.isCompleted) {
    await deleteCache(`enrollment:${enrollmentId}`);
    await invalidateStudentEnrollmentListCache(enrollment.studentId.toString());
  }

  return enrollment.isCompleted;
};

/**
 * Delete an enrollment and clean up related records.
 */
export const deleteEnrollment = async (enrollmentId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new Error('Invalid enrollment ID');
  }

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  const studentId = enrollment.studentId.toString();
  const courseId = enrollment.courseId.toString();
  const certificateId = enrollment.certificateId?.toString();

  await Enrollment.findByIdAndDelete(enrollmentId);

  if (certificateId) {
    await Certificate.findByIdAndDelete(certificateId);
    await deleteCache(`certificate:${certificateId}`);
  } else {
    const certificate = await Certificate.findOneAndDelete({ enrollmentId });
    if (certificate?._id) {
      await deleteCache(`certificate:${certificate._id.toString()}`);
    }
  }

  await deleteCache(`enrollment:${enrollmentId}`);
  await invalidateStudentEnrollmentListCache(studentId);
  await deleteCache(`enrollments:course:${courseId}`);
  await deleteCache(`certificates:student:${studentId}`);

  await Course.findByIdAndUpdate(courseId, {
    $inc: { enrollmentCount: -1 },
  });
};
