/**
 * InstructorDashboardPage - Dashboard for instructors
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchInstructorAnalytics } from '../store/slices/analyticsSlice';
import { logout as logoutAction } from '../store/slices/authSlice';
import InstructorStats from '../components/instructor/InstructorStats';
import CourseAnalytics from '../components/instructor/CourseAnalytics';
import EnrollmentChart from '../components/instructor/EnrollmentChart';
import RevenueChart from '../components/instructor/RevenueChart';
import DashboardLayout from '../components/layout/DashboardLayout';
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

const InstructorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [tabValue, setTabValue] = useState(0);
  const { t } = useLocalization();
  
  const { instructorData, isLoading, error } = useSelector((state: RootState) => state.analytics);

  useEffect(() => {
    dispatch(fetchInstructorAnalytics());
  }, [dispatch]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateCourse = () => {
    navigate('/instructor/courses/create');
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

  if (!instructorData) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="info">No analytics data available</Alert>
        </Container>
      </DashboardLayout>
    );
  }

  const statsData = {
    totalCourses: instructorData.totalCourses,
    totalStudents: instructorData.totalStudents,
    totalRevenue: instructorData.totalRevenue,
    averageRating: instructorData.averageRating,
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">{t('instructorDashboard')}</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LogoutRoundedIcon />}
            onClick={() => void handleLogout()}
          >
            {t('logout')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/instructor/assignments')}>
            {t('assignments')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateCourse}
          >
            {t('createCourse')}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <InstructorStats {...statsData} />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Courses" />
          <Tab label="Analytics" />
          <Tab label="Students" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <CourseAnalytics courses={instructorData.courses} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
            <EnrollmentChart data={instructorData.enrollmentTrends} />
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
            <RevenueChart data={instructorData.revenueTrends} />
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Student Activity
          </Typography>
          {instructorData.recentStudents.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No recent student activity
            </Typography>
          ) : (
            <List>
              {instructorData.recentStudents.map((student) => (
                <ListItem
                  key={student.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <ListItemText
                    primary={student.name}
                    secondary={student.course}
                  />
                  <Chip
                    label={`${student.progress}% Complete`}
                    color={student.progress >= 75 ? 'success' : 'default'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </TabPanel>
    </Container>
    </DashboardLayout>
  );
};

export default InstructorDashboardPage;
