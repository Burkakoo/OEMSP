import mongoose from 'mongoose';
import User from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Payment from '../models/Payment';
import QuizResult from '../models/QuizResult';
import Certificate from '../models/Certificate';
import { getCache, setCache } from '../utils/cache.utils';

const CACHE_TTL = 600; // 10 minutes for analytics

/**
 * Analytics Service
 * Provides analytics and reporting functionality for different user roles
 */

/**
 * Student Dashboard Analytics
 */
export const getStudentAnalytics = async (studentId: string): Promise<{
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  certificates: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalSpent: number;
  recentActivity: any[];
}> => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid student ID');
  }

  // Try cache first
  const cacheKey = `analytics:student:${studentId}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get enrollments
  const enrollments = await Enrollment.find({ studentId });
  const enrolledCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.isCompleted).length;
  const inProgressCourses = enrolledCourses - completedCourses;

  // Get certificates
  const certificates = await Certificate.countDocuments({ studentId });

  // Get quiz results
  const quizResults = await QuizResult.find({ studentId });
  const totalQuizzesTaken = quizResults.length;
  const averageQuizScore = quizResults.length > 0
    ? quizResults.reduce((sum, result) => sum + result.percentage, 0) / quizResults.length
    : 0;

  // Get total spent
  const payments = await Payment.find({ userId: studentId, status: 'completed' });
  const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Get recent activity (last 10 enrollments and quiz results)
  const recentEnrollments = await Enrollment.find({ studentId })
    .sort({ enrolledAt: -1 })
    .limit(5)
    .populate('courseId', 'title');

  const recentQuizResults = await QuizResult.find({ studentId })
    .sort({ submittedAt: -1 })
    .limit(5)
    .populate('quizId', 'title');

  const recentActivity = [
    ...recentEnrollments.map(e => ({
      type: 'enrollment',
      date: e.enrolledAt,
      description: `Enrolled in ${(e.courseId as any)?.title || 'Unknown Course'}`,
    })),
    ...recentQuizResults.map(r => ({
      type: 'quiz',
      date: r.submittedAt,
      description: `Completed quiz: ${(r.quizId as any)?.title || 'Unknown Quiz'}`,
      score: `${r.score} (${r.percentage}%)`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  const analytics = {
    enrolledCourses,
    completedCourses,
    inProgressCourses,
    certificates,
    totalQuizzesTaken,
    averageQuizScore: Math.round(averageQuizScore * 100) / 100,
    totalSpent,
    recentActivity,
  };

  // Cache the result
  await setCache(cacheKey, analytics, CACHE_TTL);

  return analytics;
};

/**
 * Instructor Dashboard Analytics
 */
export const getInstructorAnalytics = async (instructorId: string): Promise<{
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  courseStats: any[];
  recentEnrollments: any[];
}> => {
  if (!mongoose.Types.ObjectId.isValid(instructorId)) {
    throw new Error('Invalid instructor ID');
  }

  // Try cache first
  const cacheKey = `analytics:instructor:${instructorId}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get courses
  const courses = await Course.find({ instructorId });
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.isPublished).length;
  const draftCourses = totalCourses - publishedCourses;

  // Get enrollments for instructor's courses
  const courseIds = courses.map(c => c._id);
  const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
    .populate('studentId', 'firstName lastName email')
    .populate('courseId', 'title');

  const totalStudents = new Set(enrollments.map(e => e.studentId.toString())).size;

  // Get revenue from instructor's courses
  const payments = await Payment.find({
    courseId: { $in: courseIds },
    status: 'completed',
  });
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate average rating (placeholder - would need rating system)
  const averageRating = 0; // TODO: Implement when rating system is added

  // Get course stats
  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const courseEnrollments = enrollments.filter(
        e => e.courseId._id.toString() === course._id.toString()
      );
      const completedEnrollments = courseEnrollments.filter(e => e.isCompleted).length;

      return {
        courseId: course._id,
        title: course.title,
        enrollments: courseEnrollments.length,
        completions: completedEnrollments,
        completionRate: courseEnrollments.length > 0
          ? Math.round((completedEnrollments / courseEnrollments.length) * 100)
          : 0,
        isPublished: course.isPublished,
      };
    })
  );

  // Get recent enrollments
  const recentEnrollments = enrollments
    .sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime())
    .slice(0, 10)
    .map(e => ({
      studentName: `${(e.studentId as any).firstName} ${(e.studentId as any).lastName}`,
      courseTitle: (e.courseId as any).title,
      enrolledAt: e.enrolledAt,
      progress: e.completionPercentage,
    }));

  const analytics = {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalStudents,
    totalRevenue,
    averageRating,
    courseStats,
    recentEnrollments,
  };

  // Cache the result
  await setCache(cacheKey, analytics, CACHE_TTL);

  return analytics;
};

/**
 * Admin Dashboard Analytics
 */
export const getAdminAnalytics = async (): Promise<{
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  revenueByMonth: any[];
  topCourses: any[];
  topInstructors: any[];
  recentUsers: any[];
}> => {
  // Try cache first
  const cacheKey = 'analytics:admin';
  const cached = await getCache<any>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get user counts
  const [totalUsers, totalStudents, totalInstructors, totalAdmins] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
    User.countDocuments({ role: 'admin' }),
  ]);

  // Get course counts
  const [totalCourses, publishedCourses] = await Promise.all([
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
  ]);

  // Get enrollment count
  const totalEnrollments = await Enrollment.countDocuments();

  // Get total revenue
  const payments = await Payment.find({ status: 'completed' });
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Get revenue by month (last 12 months)
  const revenueByMonth = await getRevenueByMonth(12);

  // Get top courses by enrollment
  const topCourses = await Enrollment.aggregate([
    {
      $group: {
        _id: '$courseId',
        enrollmentCount: { $sum: 1 },
        completionCount: {
          $sum: { $cond: ['$isCompleted', 1, 0] },
        },
      },
    },
    { $sort: { enrollmentCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    {
      $project: {
        courseId: '$_id',
        title: '$course.title',
        enrollments: '$enrollmentCount',
        completions: '$completionCount',
        completionRate: {
          $multiply: [
            { $divide: ['$completionCount', '$enrollmentCount'] },
            100,
          ],
        },
      },
    },
  ]);

  // Get top instructors by student count
  const topInstructors = await Enrollment.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    {
      $group: {
        _id: '$course.instructorId',
        studentCount: { $addToSet: '$studentId' },
        courseCount: { $addToSet: '$courseId' },
      },
    },
    {
      $project: {
        instructorId: '$_id',
        studentCount: { $size: '$studentCount' },
        courseCount: { $size: '$courseCount' },
      },
    },
    { $sort: { studentCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: 'instructorId',
        foreignField: '_id',
        as: 'instructor',
      },
    },
    { $unwind: '$instructor' },
    {
      $project: {
        instructorId: 1,
        name: {
          $concat: ['$instructor.firstName', ' ', '$instructor.lastName'],
        },
        email: '$instructor.email',
        studentCount: 1,
        courseCount: 1,
      },
    },
  ]);

  // Get recent users
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('firstName lastName email role createdAt');

  const analytics = {
    totalUsers,
    totalStudents,
    totalInstructors,
    totalAdmins,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    totalRevenue,
    revenueByMonth,
    topCourses,
    topInstructors,
    recentUsers,
  };

  // Cache the result
  await setCache(cacheKey, analytics, CACHE_TTL);

  return analytics;
};

/**
 * Get enrollment statistics
 */
export const getEnrollmentStatistics = async (filters: {
  courseId?: string;
  instructorId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
  averageProgress: number;
  enrollmentsByMonth: any[];
}> => {
  const query: any = {};

  if (filters.courseId) {
    if (!mongoose.Types.ObjectId.isValid(filters.courseId)) {
      throw new Error('Invalid course ID');
    }
    query.courseId = filters.courseId;
  }

  if (filters.instructorId) {
    if (!mongoose.Types.ObjectId.isValid(filters.instructorId)) {
      throw new Error('Invalid instructor ID');
    }
    // Get courses by instructor
    const courses = await Course.find({ instructorId: filters.instructorId });
    query.courseId = { $in: courses.map(c => c._id) };
  }

  if (filters.startDate || filters.endDate) {
    query.enrolledAt = {};
    if (filters.startDate) query.enrolledAt.$gte = filters.startDate;
    if (filters.endDate) query.enrolledAt.$lte = filters.endDate;
  }

  const enrollments = await Enrollment.find(query);

  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.isCompleted).length;
  const inProgressEnrollments = totalEnrollments - completedEnrollments;
  const averageProgress = totalEnrollments > 0
    ? enrollments.reduce((sum, e) => sum + e.completionPercentage, 0) / totalEnrollments
    : 0;

  // Group by month
  const enrollmentsByMonth = await Enrollment.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: '$enrolledAt' },
          month: { $month: '$enrolledAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return {
    totalEnrollments,
    completedEnrollments,
    inProgressEnrollments,
    averageProgress: Math.round(averageProgress * 100) / 100,
    enrollmentsByMonth,
  };
};

/**
 * Get revenue statistics
 */
export const getRevenueStatistics = async (filters: {
  instructorId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  revenueByMonth: any[];
  revenueByCourse: any[];
}> => {
  const query: any = { status: 'completed' };

  if (filters.instructorId) {
    if (!mongoose.Types.ObjectId.isValid(filters.instructorId)) {
      throw new Error('Invalid instructor ID');
    }
    // Get courses by instructor
    const courses = await Course.find({ instructorId: filters.instructorId });
    query.courseId = { $in: courses.map(c => c._id) };
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }

  const payments = await Payment.find(query);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalTransactions = payments.length;
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Revenue by month
  const revenueByMonth = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Revenue by course
  const revenueByCourse = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$courseId',
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    {
      $project: {
        courseId: '$_id',
        title: '$course.title',
        revenue: 1,
        transactions: '$count',
      },
    },
  ]);

  return {
    totalRevenue,
    totalTransactions,
    averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
    revenueByMonth,
    revenueByCourse,
  };
};

/**
 * Get quiz performance analytics
 */
export const getQuizPerformanceAnalytics = async (filters: {
  studentId?: string;
  courseId?: string;
  quizId?: string;
}): Promise<{
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  scoreDistribution: any[];
}> => {
  const query: any = {};

  if (filters.studentId) {
    if (!mongoose.Types.ObjectId.isValid(filters.studentId)) {
      throw new Error('Invalid student ID');
    }
    query.studentId = filters.studentId;
  }

  if (filters.quizId) {
    if (!mongoose.Types.ObjectId.isValid(filters.quizId)) {
      throw new Error('Invalid quiz ID');
    }
    query.quizId = filters.quizId;
  }

  const quizResults = await QuizResult.find(query);

  const totalAttempts = quizResults.length;
  const averageScore = totalAttempts > 0
    ? quizResults.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts
    : 0;

  // Assuming pass threshold is 60%
  const passedAttempts = quizResults.filter(r => r.percentage >= 60).length;
  const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

  // Score distribution (0-20, 21-40, 41-60, 61-80, 81-100)
  const scoreDistribution = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ];

  quizResults.forEach(r => {
    const percentage = r.percentage;
    if (percentage <= 20 && scoreDistribution[0]) {
      scoreDistribution[0].count++;
    } else if (percentage <= 40 && scoreDistribution[1]) {
      scoreDistribution[1].count++;
    } else if (percentage <= 60 && scoreDistribution[2]) {
      scoreDistribution[2].count++;
    } else if (percentage <= 80 && scoreDistribution[3]) {
      scoreDistribution[3].count++;
    } else if (scoreDistribution[4]) {
      scoreDistribution[4].count++;
    }
  });

  return {
    totalAttempts,
    averageScore: Math.round(averageScore * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
    scoreDistribution,
  };
};

/**
 * Helper: Get revenue by month for last N months
 */
async function getRevenueByMonth(months: number): Promise<any[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const revenueByMonth = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return revenueByMonth;
}
