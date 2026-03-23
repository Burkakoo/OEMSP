/**
 * Course details page
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, CircularProgress, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchCourse, clearCurrentCourse } from '@store/slices/courseSlice';
import CourseDetails from '@components/courses/CourseDetails';
import { enrollmentService } from '@/services/enrollment.service';

const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCourse, isLoading } = useAppSelector((state) => state.courses);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (id) {
      // Clear any cached data for this course to ensure we get fresh data with isFree field
      dispatch(fetchCourse(id));
    }

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [dispatch, id]);

  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (!id) return;

      try {
        const response = await enrollmentService.getEnrollments({
          courseId: id,
          page: 1,
          limit: 1,
        });
        setIsEnrolled(response.data.enrollments.length > 0);
      } catch (error) {
        console.error('Failed to check enrollment status:', error);
        setIsEnrolled(false);
      }
    };

    checkEnrollmentStatus();
  }, [id]);

  const handleEnroll = async () => {
    if (!id) return;
    
    if (currentCourse && currentCourse.isFree) {
      // Handle free course enrollment directly
      try {
        await enrollmentService.enrollInFreeCourse(id);
        alert('Successfully enrolled in free course!');
        // Reload to update enrollment status
        window.location.reload();
      } catch (error: any) {
        alert(error.message || 'Failed to enroll in free course');
      }
    } else {
      // Redirect to payment page for paid courses
      navigate(`/courses/${id}/enroll`);
    }
  };

  const handleBack = () => {
    navigate('/courses');
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!currentCourse) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <p>Course not found</p>
          <Button onClick={handleBack}>Back to Courses</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Courses
        </Button>
        <CourseDetails course={currentCourse} onEnroll={handleEnroll} isEnrolled={isEnrolled} />
      </Box>
    </Container>
  );
};

export default CourseDetailsPage;
