/**
 * Create course page (instructor only)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Paper, Button, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { createCourse } from '@store/slices/courseSlice';
import CourseForm from '@components/courses/CourseForm';
import { CreateCourseData, UpdateCourseData } from '@/types/course.types';

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.courses);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleSubmit = async (data: CreateCourseData | UpdateCourseData) => {
    setSubmitError(null);
    try {
      const result = await dispatch(createCourse(data as CreateCourseData)).unwrap();
      navigate(`/instructor/courses/${result._id}/edit`);
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : (error as any)?.message || 'Failed to create course';
      setSubmitError(message);
    }
  };

  const handleCancel = () => {
    navigate('/instructor/courses');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/instructor/courses')}
          sx={{ mb: 2 }}
        >
          Back to My Courses
        </Button>

        <Paper sx={{ p: 4 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}
          <CourseForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateCoursePage;
