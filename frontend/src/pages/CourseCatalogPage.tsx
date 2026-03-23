/**
 * Course catalog page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchCourses, setFilters } from '@store/slices/courseSlice';
import CourseList from '@components/courses/CourseList';
import { CourseFilters } from '@/types/course.types';
import { enrollmentService } from '@/services/enrollment.service';

const CourseCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { courses, isLoading, filters, pagination, error } = useAppSelector((state) => state.courses);

  const [localFilters, setLocalFilters] = useState<CourseFilters>(filters);

  const categories = React.useMemo(() => {
    const unique = Array.from(new Set(courses.map((c) => c.category || '').filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [courses]);

  useEffect(() => {
    dispatch(fetchCourses({ filters, page: pagination.page, limit: pagination.limit }));
  }, [dispatch, filters, pagination.page, pagination.limit]);

  const handleFilterChange = (name: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    dispatch(setFilters(localFilters));
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    dispatch(setFilters({}));
  };

  const handleViewDetails = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleEnroll = async (courseId: string) => {
    // Find the course to check if it's free
    const course = courses.find(c => c._id === courseId);
    
    if (course && course.isFree) {
      // Handle free course enrollment directly
      try {
        await enrollmentService.enrollInFreeCourse(courseId);
        alert('Successfully enrolled in free course!');
        // Refresh courses to update enrollment status
        dispatch(fetchCourses({ filters, page: pagination.page, limit: pagination.limit }));
      } catch (error: any) {
        alert(error.message || 'Failed to enroll in free course');
      }
    } else {
      // Redirect to payment page for paid courses
      navigate(`/courses/${courseId}/enroll`);
    }
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchCourses({ filters, page, limit: pagination.limit }));
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToDashboard} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Course Catalog
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid>
              <TextField
                fullWidth
                label="Search"
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Grid>
            <Grid>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={localFilters.category || ''}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={localFilters.level || ''}
                  label="Level"
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleApplyFilters} fullWidth>
                  Apply
                </Button>
                <Button variant="outlined" onClick={handleClearFilters} fullWidth>
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <CourseList
          courses={courses}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onEnroll={handleEnroll}
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </Box>
    </Container>
  );
};

export default CourseCatalogPage;
