/**
 * CourseManagement component - Manages courses for admin
 */

import React, { useState } from 'react';
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
  IconButton,
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  CheckCircleOutline as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Course {
  _id: string;
  title: string;
  instructorName: string;
  category: string;
  level: string;
  price: number;
  enrollmentCount: number;
  isPublished: boolean;
  reviewStatus?: string;
  reviewNotes?: string;
  createdAt: string;
}

interface CourseManagementProps {
  courses: Course[];
  onApproveCourse?: (courseId: string) => Promise<void>;
  onRejectCourse?: (courseId: string) => Promise<void>;
}

const CourseManagement: React.FC<CourseManagementProps> = ({
  courses,
  onApproveCourse,
  onRejectCourse,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Course Management</Typography>
        <TextField
          size="small"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Instructor</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Enrollments</TableCell>
              <TableCell>Review</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No courses found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course) => (
                <TableRow key={course._id}>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.instructorName}</TableCell>
                  <TableCell>{course.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={course.level}
                      color={getLevelColor(course.level)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{course.price} ETB</TableCell>
                  <TableCell>{course.enrollmentCount}</TableCell>
                  <TableCell>
                    <Chip
                      label={course.reviewStatus?.replace('_', ' ') || 'legacy'}
                      size="small"
                      color={
                        course.reviewStatus === 'approved'
                          ? 'success'
                          : course.reviewStatus === 'pending_review'
                            ? 'warning'
                            : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        course.reviewStatus === 'pending_review'
                          ? 'Pending Review'
                          : course.reviewStatus === 'changes_requested'
                          ? 'Changes Requested'
                          : course.reviewStatus === 'approved'
                          ? 'Approved'
                          : course.isPublished
                          ? 'Published'
                          : 'Draft'
                      }
                      color={
                        course.reviewStatus === 'pending_review'
                          ? 'warning'
                          : course.reviewStatus === 'changes_requested'
                          ? 'error'
                          : course.reviewStatus === 'approved' || course.isPublished
                          ? 'success'
                          : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {course.reviewStatus === 'pending_review' && onApproveCourse && onRejectCourse && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => onApproveCourse(course._id)}
                          title="Approve Course"
                        >
                          <ApproveIcon fontSize="small" color="success" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onRejectCourse(course._id)}
                          title="Reject Course"
                        >
                          <RejectIcon fontSize="small" color="error" />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleViewCourse(course._id)}
                      title="View Course"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default CourseManagement;
