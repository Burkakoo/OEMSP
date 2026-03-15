import mongoose from 'mongoose';
import Enrollment, { IEnrollment, ILessonProgress } from '../models/Enrollment';
import Course from '../models/Course';
import Payment from '../models/Payment';
import { getCache, setCache, deleteCache } from '../utils/cache.utils';

const CACHE_TTL = 300; // 5 minutes

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
  await deleteCache(`enrollments:student:${studentId}`);
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
  isCompleted?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ enrollments: IEnrollment[]; total: number; page: number; pages: number }> => {
  const { studentId, courseId, isCompleted, page = 1, limit = 10 } = filters;

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

  // Find the lesson progress entry
  const lessonProgress = enrollment.progress.find(
    (p) => p.lessonId.toString() === lessonId
  );

  if (!lessonProgress) {
    throw new Error('Lesson not found in enrollment progress');
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
  const completionPercentage = calculateProgress(enrollment);
  enrollment.completionPercentage = completionPercentage;

  // Check if course is completed
  if (completionPercentage === 100 && !enrollment.isCompleted) {
    enrollment.isCompleted = true;
    enrollment.completedAt = new Date();
  }

  await enrollment.save();

  // Invalidate caches
  await deleteCache(`enrollment:${enrollmentId}`);
  await deleteCache(`enrollments:student:${enrollment.studentId}`);

  return enrollment;
};

/**
 * Calculate completion percentage for an enrollment
 */
export const calculateProgress = (enrollment: IEnrollment): number => {
  if (!enrollment.progress || enrollment.progress.length === 0) {
    return 0;
  }

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

  // Update completion status if needed
  if (allCompleted && !enrollment.isCompleted) {
    enrollment.isCompleted = true;
    enrollment.completedAt = new Date();
    enrollment.completionPercentage = 100;
    await enrollment.save();

    // Invalidate caches
    await deleteCache(`enrollment:${enrollmentId}`);
    await deleteCache(`enrollments:student:${enrollment.studentId}`);
  }

  return enrollment.isCompleted;
};
