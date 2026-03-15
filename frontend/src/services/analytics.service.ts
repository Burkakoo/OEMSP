/**
 * Analytics Service - Handles analytics API calls
 */

import api from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface InstructorAnalytics {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  courses: CourseAnalytics[];
  enrollmentTrends: EnrollmentTrend[];
  revenueTrends: RevenueTrend[];
  recentStudents: RecentStudent[];
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  enrollments: number;
  completionRate: number;
  averageQuizScore: number;
  revenue: number;
}

export interface EnrollmentTrend {
  month: string;
  enrollments: number;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
}

export interface RecentStudent {
  id: string;
  name: string;
  course: string;
  progress: number;
}

export interface StudentAnalytics {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalCertificates: number;
  averageProgress: number;
  recentActivity: any[];
}

export interface AdminAnalytics {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  revenueData: RevenueTrend[];
  monthlyAverage: number;
  revenueGrowth: number;
  topCourses: any[];
  topInstructors: any[];
  recentUsers: any[];
}

type BackendInstructorAnalytics = {
  totalCourses?: number;
  totalStudents?: number;
  totalRevenue?: number;
  averageRating?: number;
  courseStats?: Array<{
    courseId: string;
    title: string;
    enrollments: number;
    completionRate: number;
  }>;
  recentEnrollments?: Array<{
    studentName: string;
    courseTitle: string;
    enrolledAt: string;
    progress: number;
  }>;
};

const normalizeInstructorAnalytics = (raw: any): InstructorAnalytics => {
  const data: BackendInstructorAnalytics =
    raw && typeof raw === 'object' && 'data' in raw ? (raw as any).data : raw;

  const courses = Array.isArray(data?.courseStats)
    ? data.courseStats.map((c) => ({
        courseId: String(c.courseId),
        courseName: c.title,
        enrollments: Number(c.enrollments ?? 0),
        completionRate: Number(c.completionRate ?? 0),
        // Not yet provided by backend analytics
        averageQuizScore: 0,
        revenue: 0,
      }))
    : [];

  const recentStudents = Array.isArray(data?.recentEnrollments)
    ? data.recentEnrollments.map((e, idx) => ({
        id: `${idx}-${e.enrolledAt ?? ''}`,
        name: e.studentName,
        course: e.courseTitle,
        progress: Number(e.progress ?? 0),
      }))
    : [];

  return {
    totalCourses: Number(data?.totalCourses ?? 0),
    totalStudents: Number(data?.totalStudents ?? 0),
    totalRevenue: Number(data?.totalRevenue ?? 0),
    averageRating: Number(data?.averageRating ?? 0),
    courses,
    // Not yet provided by backend analytics
    enrollmentTrends: [],
    revenueTrends: [],
    recentStudents,
  };
};

type BackendAdminAnalytics = {
  totalUsers?: number;
  totalStudents?: number;
  totalInstructors?: number;
  totalAdmins?: number;
  totalCourses?: number;
  publishedCourses?: number;
  totalEnrollments?: number;
  totalRevenue?: number;
  revenueByMonth?: Array<{
    _id?: { year: number; month: number };
    revenue?: number;
    count?: number;
  }>;
  topCourses?: any[];
  topInstructors?: any[];
  recentUsers?: any[];
};

const normalizeAdminAnalytics = (raw: any): AdminAnalytics => {
  const data: BackendAdminAnalytics =
    raw && typeof raw === 'object' && 'data' in raw ? (raw as any).data : raw;

  const revenueData: RevenueTrend[] = Array.isArray(data?.revenueByMonth)
    ? data.revenueByMonth.map((row) => {
        const year = Number(row?._id?.year ?? 0);
        const month = Number(row?._id?.month ?? 0);
        const date = year && month ? new Date(year, month - 1, 1) : new Date();
        const label = date.toLocaleString(undefined, { month: 'short', year: 'numeric' });
        return {
          month: label,
          revenue: Number(row?.revenue ?? 0),
        };
      })
    : [];

  const monthlyAverage =
    revenueData.length > 0
      ? Math.round((revenueData.reduce((sum, r) => sum + r.revenue, 0) / revenueData.length) * 100) /
        100
      : 0;

  const revenueGrowth = (() => {
    if (revenueData.length < 2) return 0;
    const last = revenueData[revenueData.length - 1]?.revenue ?? 0;
    const prev = revenueData[revenueData.length - 2]?.revenue ?? 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    return Math.round(((last - prev) / prev) * 10000) / 100;
  })();

  return {
    totalUsers: Number(data?.totalUsers ?? 0),
    totalStudents: Number(data?.totalStudents ?? 0),
    totalInstructors: Number(data?.totalInstructors ?? 0),
    totalAdmins: Number(data?.totalAdmins ?? 0),
    totalCourses: Number(data?.totalCourses ?? 0),
    publishedCourses: Number(data?.publishedCourses ?? 0),
    totalEnrollments: Number(data?.totalEnrollments ?? 0),
    totalRevenue: Number(data?.totalRevenue ?? 0),
    revenueData,
    monthlyAverage,
    revenueGrowth,
    topCourses: Array.isArray(data?.topCourses) ? data.topCourses : [],
    topInstructors: Array.isArray(data?.topInstructors) ? data.topInstructors : [],
    recentUsers: Array.isArray(data?.recentUsers) ? data.recentUsers : [],
  };
};

class AnalyticsService {
  async getInstructorAnalytics(): Promise<InstructorAnalytics> {
    const response = await api<ApiResponse<BackendInstructorAnalytics>>('/analytics/instructor');
    return normalizeInstructorAnalytics(response);
  }

  async getStudentAnalytics(): Promise<StudentAnalytics> {
    const response = await api<ApiResponse<StudentAnalytics>>('/analytics/student');
    return response.data;
  }

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const response = await api<ApiResponse<BackendAdminAnalytics>>('/analytics/admin');
    return normalizeAdminAnalytics(response);
  }
}

export default new AnalyticsService();
