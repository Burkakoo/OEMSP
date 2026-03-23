/**
 * AdminDashboardPage - Dashboard for administrators
 */

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchAdminAnalytics } from '../store/slices/analyticsSlice';
import adminService, { PendingInstructor } from '../services/admin.service';
import userService, { UserListItem } from '../services/user.service';
import { courseService } from '../services/course.service';
import PlatformStats from '../components/admin/PlatformStats';
import UserManagement from '../components/admin/UserManagement';
import CourseManagement from '../components/admin/CourseManagement';
import RevenueReports from '../components/admin/RevenueReports';
import PaymentStatistics from '../components/admin/PaymentStatistics';
import PendingInstructorApprovals from '../components/admin/PendingInstructorApprovals';
import DashboardLayout from '../components/layout/DashboardLayout';
import type { Course } from '../types/course.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const AdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [pendingInstructors, setPendingInstructors] = useState<PendingInstructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [instructorError, setInstructorError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const { adminData, isLoading, error } = useSelector(
    (state: RootState) => state.analytics
  );

  useEffect(() => {
    dispatch(fetchAdminAnalytics());
    loadPendingInstructors();
    void loadUsers();
    void loadCourses();
  }, [dispatch]);

  const loadPendingInstructors = async () => {
    try {
      setLoadingInstructors(true);
      setInstructorError(null);
      const instructors = await adminService.getPendingInstructors();
      setPendingInstructors(instructors);
    } catch (err: any) {
      setInstructorError(err.message || 'Failed to load pending instructors');
    } finally {
      setLoadingInstructors(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setUsersError(null);
      const resp = await userService.listUsers({}, 1, 100);
      setUsers(resp.data.users);
    } catch (err: any) {
      setUsersError(err.message || 'Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setCoursesError(null);
      const resp = await courseService.getCourses({}, 1, 100);
      setCourses(resp.data.courses);
    } catch (err: any) {
      setCoursesError(err.message || 'Failed to load courses');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleApproveInstructor = async (instructorId: string) => {
    try {
      await adminService.approveInstructor(instructorId);
      // Remove from pending list
      setPendingInstructors((prev) =>
        prev.filter((instructor) => instructor._id !== instructorId)
      );
    } catch (err: any) {
      setInstructorError(err.message || 'Failed to approve instructor');
    }
  };

  const handleRejectInstructor = async (instructorId: string) => {
    try {
      await adminService.rejectInstructor(instructorId, 'Application rejected by admin');
      // Remove from pending list
      setPendingInstructors((prev) =>
        prev.filter((instructor) => instructor._id !== instructorId)
      );
    } catch (err: any) {
      setInstructorError(err.message || 'Failed to reject instructor');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await userService.deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </DashboardLayout>
    );
  }

  if (!adminData) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="info">No analytics data available</Alert>
        </Container>
      </DashboardLayout>
    );
  }

  const instructorNameById = new Map(
    users.map((u) => [u._id, `${u.firstName} ${u.lastName}`] as const)
  );

  const coursesForManagement = courses.map((course) => ({
    _id: course._id,
    title: course.title,
    instructorName:
      instructorNameById.get(course.instructorId) ||
      (course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : '') ||
      course.instructorId ||
      'Unknown',
    category: course.category,
    level: course.level,
    price: course.price,
    enrollmentCount: course.enrollmentCount,
    isPublished: course.isPublished,
    createdAt: course.createdAt,
  }));

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Platform overview and management
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <PlatformStats
          totalUsers={adminData.totalUsers}
          totalCourses={adminData.totalCourses}
          totalEnrollments={adminData.totalEnrollments}
          totalRevenue={adminData.totalRevenue}
        />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Users" />
          <Tab label="Courses" />
          <Tab label="Revenue" />
          <Tab label="Instructor Approvals" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {usersError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {usersError}
          </Alert>
        )}
        {isLoadingUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <UserManagement users={users} onDeleteUser={handleDeleteUser} />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {coursesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {coursesError}
          </Alert>
        )}
        {isLoadingCourses ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <CourseManagement courses={coursesForManagement} />
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 420px', minWidth: '320px' }}>
            <RevenueReports
              data={adminData.revenueData || []}
              totalRevenue={adminData.totalRevenue}
              monthlyAverage={adminData.monthlyAverage || 0}
              growth={adminData.revenueGrowth || 0}
            />
          </Box>
          <Box sx={{ flex: '1 1 420px', minWidth: '320px' }}>
            <PaymentStatistics />
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {instructorError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {instructorError}
          </Alert>
        )}
        {loadingInstructors ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <PendingInstructorApprovals
            instructors={pendingInstructors}
            onApprove={handleApproveInstructor}
            onReject={handleRejectInstructor}
          />
        )}
      </TabPanel>
    </Container>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
