/**
 * CourseAnalytics component - Displays analytics for instructor's courses
 */

import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface CourseAnalytic {
  courseId: string;
  courseName: string;
  enrollments: number;
  completionRate: number;
  averageQuizScore: number;
  revenue: number;
  isPublished?: boolean;
}

interface CourseAnalyticsProps {
  courses: CourseAnalytic[];
  onEditCourse?: (courseId: string) => void;
  onDeleteCourse?: (courseId: string, courseName: string) => void;
  deletingCourseId?: string | null;
}

const CourseAnalytics: React.FC<CourseAnalyticsProps> = ({
  courses,
  onEditCourse,
  onDeleteCourse,
  deletingCourseId,
}) => {
  const getCompletionColor = (rate: number) => {
    if (rate >= 75) return 'success';
    if (rate >= 50) return 'warning';
    return 'error';
  };

  if (courses.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No course analytics available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Course Performance
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course Name</TableCell>
              <TableCell align="right">Enrollments</TableCell>
              <TableCell align="right">Completion Rate</TableCell>
              <TableCell align="right">Avg Quiz Score</TableCell>
              <TableCell align="right">Revenue (ETB)</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.courseId}>
                <TableCell>{course.courseName}</TableCell>
                <TableCell align="right">{course.enrollments}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${course.completionRate}%`}
                    color={getCompletionColor(course.completionRate)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {course.averageQuizScore.toFixed(1)}%
                </TableCell>
                <TableCell align="right">{course.revenue}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={course.isPublished ? 'Published' : 'Draft'}
                    color={course.isPublished ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit Course">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onEditCourse?.(course.courseId)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete Course">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteCourse?.(course.courseId, course.courseName)}
                        disabled={deletingCourseId === course.courseId}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Total Courses: {courses.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Revenue: {courses.reduce((sum, c) => sum + c.revenue, 0)} ETB
        </Typography>
      </Box>
    </Paper>
  );
};

export default CourseAnalytics;
