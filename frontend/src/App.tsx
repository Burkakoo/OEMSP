/**
 * Main App component for OICT TUTOR Frontend
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '@components/layout/PublicLayout';
import HomePage from '@pages/HomePage';
import AboutPage from '@pages/AboutPage';
import ContactPage from '@pages/ContactPage';
import LoginPage from '@pages/LoginPage';
import RegisterPage from '@pages/RegisterPage';
import ForgotPasswordPage from '@pages/ForgotPasswordPage';
import PendingApprovalPage from '@pages/PendingApprovalPage';
import UnauthorizedPage from '@pages/UnauthorizedPage';
import NotFoundPage from '@pages/NotFoundPage';
import CertificateVerificationPage from '@pages/CertificateVerificationPage';
import DashboardPage from '@pages/DashboardPage';
import StudentDashboardPage from '@pages/StudentDashboardPage';
import InstructorDashboardPage from './pages/InstructorDashboardPage';
import InstructorCourseStudentsPage from './pages/InstructorCourseStudentsPage';
import InstructorCoursesPage from './pages/InstructorCoursesPage';
import InstructorAssignmentsPage from './pages/InstructorAssignmentsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CreateCoursePage from '@pages/CreateCoursePage';
import EditCoursePage from '@pages/EditCoursePage';
import CourseCatalogPage from '@pages/CourseCatalogPage';
import CourseDetailsPage from '@pages/CourseDetailsPage';
import CoursePlayerPage from '@pages/CoursePlayerPage';
import CourseDiscussionPage from '@pages/CourseDiscussionPage';
import CourseQuestionBankPage from '@pages/CourseQuestionBankPage';
import QuizTakingPage from '@pages/QuizTakingPage';
import QuizResultsPage from '@pages/QuizResultsPage';
import CreateQuizPage from '@pages/CreateQuizPage';
import EditQuizPage from '@pages/EditQuizPage';
import CheckoutPage from '@pages/CheckoutPage';
import PaymentSuccessPage from '@pages/PaymentSuccessPage';
import PaymentPendingPage from '@pages/PaymentPendingPage';
import PaymentFailurePage from '@pages/PaymentFailurePage';
import ProtectedRoute from '@components/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/certificates/:certificateId/verify" element={<CertificateVerificationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute requiredRole={['student', 'admin']}>
              <CourseCatalogPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute requiredRole={['student', 'admin']}>
              <CourseDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:id/learn"
          element={
            <ProtectedRoute requiredRole="student">
              <CoursePlayerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:courseId/discussions"
          element={
            <ProtectedRoute requiredRole={['student', 'instructor', 'admin']} requireApproval>
              <CourseDiscussionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:courseId/enroll"
          element={
            <ProtectedRoute requiredRole="student">
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <InstructorDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/courses"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <InstructorCoursesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/courses/:courseId/students"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <InstructorCourseStudentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/assignments"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <InstructorAssignmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/courses/create"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <CreateCoursePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/courses/:id/edit"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <EditCoursePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/courses/:courseId/question-bank"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <CourseQuestionBankPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute requiredRole="student">
              <QuizTakingPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quiz/:quizId/results"
          element={
            <ProtectedRoute requiredRole="student">
              <QuizResultsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/courses/:courseId/quiz/create"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <CreateQuizPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quiz/:quizId/edit"
          element={
            <ProtectedRoute requiredRole="instructor" requireApproval>
              <EditQuizPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/checkout/:courseId"
          element={
            <ProtectedRoute requiredRole="student">
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/payment/pending"
          element={
            <ProtectedRoute requiredRole="student">
              <PaymentPendingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/success"
          element={
            <ProtectedRoute requiredRole="student">
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/payment/failure"
          element={
            <ProtectedRoute requiredRole="student">
              <PaymentFailurePage />
            </ProtectedRoute>
          }
        />

        <Route path="/home" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
