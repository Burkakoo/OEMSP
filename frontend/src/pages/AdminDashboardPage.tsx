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
  Button,
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchAdminAnalytics } from '../store/slices/analyticsSlice';
import { logout as logoutAction } from '../store/slices/authSlice';
import adminService, { PendingInstructor } from '../services/admin.service';
import userService, { UserListItem } from '../services/user.service';
import { courseService } from '../services/course.service';
import platformSettingsService, {
  PlatformSettings,
} from '@/services/platformSettings.service';
import auditLogService, { AuditLogRecord } from '@/services/auditLog.service';
import certificateTemplateService, {
  CertificateTemplate,
} from '@/services/certificateTemplate.service';
import PlatformStats from '../components/admin/PlatformStats';
import UserManagement from '../components/admin/UserManagement';
import CourseManagement from '../components/admin/CourseManagement';
import RevenueReports from '../components/admin/RevenueReports';
import PaymentStatistics from '../components/admin/PaymentStatistics';
import PendingInstructorApprovals from '../components/admin/PendingInstructorApprovals';
import PlatformSettingsPanel from '../components/admin/PlatformSettingsPanel';
import AuditLogTable from '../components/admin/AuditLogTable';
import CertificateTemplateManager from '../components/admin/CertificateTemplateManager';
import DashboardLayout from '../components/layout/DashboardLayout';
import type { Course } from '../types/course.types';
import { useLocalization } from '@/context/LocalizationContext';

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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [tabValue, setTabValue] = useState(0);
  const { t } = useLocalization();
  const [pendingInstructors, setPendingInstructors] = useState<PendingInstructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [instructorError, setInstructorError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseReviewStatusFilter, setCourseReviewStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'changes_requested'>('pending_review');
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditLogError, setAuditLogError] = useState<string | null>(null);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const { adminData, isLoading, error } = useSelector(
    (state: RootState) => state.analytics
  );

  useEffect(() => {
    dispatch(fetchAdminAnalytics());
    loadPendingInstructors();
    void loadUsers();
    void loadPlatformSettings();
    void loadAuditLogs();
    void loadCertificateTemplates();
  }, [dispatch]);

  useEffect(() => {
    void loadCourses();
  }, [courseReviewStatusFilter]);

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
      const filters: any = {};
      if (courseReviewStatusFilter !== 'all') {
        filters.reviewStatus = courseReviewStatusFilter;
      }

      const resp = await courseService.getCourses(filters, 1, 100);
      setCourses(resp.data.courses);
    } catch (err: any) {
      setCoursesError(err.message || 'Failed to load courses');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadPlatformSettings = async () => {
    try {
      setSettingsError(null);
      const settings = await platformSettingsService.getSettings();
      setPlatformSettings(settings);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to load platform settings');
    }
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLogError(null);
      const logs = await auditLogService.getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      setAuditLogError(err.message || 'Failed to load audit logs');
    }
  };

  const loadCertificateTemplates = async () => {
    try {
      setTemplateError(null);
      const templates = await certificateTemplateService.getTemplates();
      setCertificateTemplates(templates);
    } catch (err: any) {
      setTemplateError(err.message || 'Failed to load certificate templates');
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

  const handleSetUserStatus = async (userId: string, isActive: boolean) => {
    await userService.setUserStatus(userId, isActive);
    setUsers((prev) =>
      prev.map((user) => (user._id === userId ? { ...user, isActive } : user))
    );
  };

  const handleApproveCourse = async (courseId: string) => {
    const response = await courseService.reviewCourse(courseId, 'approved');
    setCourses((prev) =>
      prev.map((course) => (course._id === courseId ? response.data : course))
    );
  };

  const handleRejectCourse = async (courseId: string) => {
    const response = await courseService.reviewCourse(
      courseId,
      'changes_requested',
      'Course rejected by admin'
    );
    setCourses((prev) =>
      prev.map((course) => (course._id === courseId ? response.data : course))
    );
  };

  const handleSavePlatformSettings = async (settings: Partial<PlatformSettings>) => {
    try {
      setIsSavingSettings(true);
      setSettingsError(null);
      const updated = await platformSettingsService.updateSettings(settings);
      setPlatformSettings(updated);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save platform settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateTemplate = async (payload: Omit<CertificateTemplate, '_id'>) => {
    await certificateTemplateService.createTemplate(payload);
    await loadCertificateTemplates();
  };

  const handleUpdateTemplate = async (
    templateId: string,
    payload: Partial<Omit<CertificateTemplate, '_id'>>
  ) => {
    await certificateTemplateService.updateTemplate(templateId, payload);
    await loadCertificateTemplates();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLogout = async () => {
    await dispatch(logoutAction());
    navigate('/login');
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
    reviewStatus: course.reviewStatus,
    reviewNotes: course.reviewNotes,
    isPublished: course.isPublished,
    createdAt: course.createdAt,
  }));

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4">{t('adminDashboard')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('platformOverview')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutRoundedIcon />}
          onClick={() => void handleLogout()}
        >
          {t('logout')}
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <PlatformStats
          totalUsers={adminData.totalUsers}
          totalCourses={adminData.totalCourses}
          totalEnrollments={adminData.totalEnrollments}
          totalRevenue={adminData.totalRevenue}
        />
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography fontWeight={700}>Course Review Filter:</Typography>
        <Button
          size="small"
          color={courseReviewStatusFilter === 'pending_review' ? 'primary' : 'inherit'}
          onClick={() => setCourseReviewStatusFilter('pending_review')}
        >
          Pending
        </Button>
        <Button
          size="small"
          color={courseReviewStatusFilter === 'approved' ? 'primary' : 'inherit'}
          onClick={() => setCourseReviewStatusFilter('approved')}
        >
          Approved
        </Button>
        <Button
          size="small"
          color={courseReviewStatusFilter === 'changes_requested' ? 'primary' : 'inherit'}
          onClick={() => setCourseReviewStatusFilter('changes_requested')}
        >
          Changes Requested
        </Button>
        <Button
          size="small"
          color={courseReviewStatusFilter === 'all' ? 'primary' : 'inherit'}
          onClick={() => setCourseReviewStatusFilter('all')}
        >
          All
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Users" />
          <Tab label="Courses" />
          <Tab label="Revenue" />
          <Tab label="Instructor Approvals" />
          <Tab label="Settings" />
          <Tab label="Templates" />
          <Tab label={t('auditLogs')} />
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
          <UserManagement
            users={users}
            onDeleteUser={handleDeleteUser}
            onActivateUser={(userId) => void handleSetUserStatus(userId, true)}
            onDeactivateUser={(userId) => void handleSetUserStatus(userId, false)}
          />
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
          <CourseManagement
            courses={coursesForManagement}
            onApproveCourse={handleApproveCourse}
            onRejectCourse={handleRejectCourse}
          />
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

      <TabPanel value={tabValue} index={4}>
        <PlatformSettingsPanel
          settings={platformSettings}
          error={settingsError}
          isSaving={isSavingSettings}
          onSave={handleSavePlatformSettings}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <CertificateTemplateManager
          templates={certificateTemplates}
          error={templateError}
          onCreate={handleCreateTemplate}
          onUpdate={handleUpdateTemplate}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        {auditLogError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {auditLogError}
          </Alert>
        )}
        <AuditLogTable logs={auditLogs} />
      </TabPanel>
    </Container>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
