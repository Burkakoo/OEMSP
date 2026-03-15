/**
 * Course list component
 */

import React from 'react';
import { Grid, Box, Typography, CircularProgress, Pagination } from '@mui/material';
import { Course } from '../../types/course.types';
import CourseCard from './CourseCard';

interface CourseListProps {
  courses: Course[];
  isLoading?: boolean;
  onViewDetails?: (courseId: string) => void;
  onEnroll?: (courseId: string) => void;
  showEnrollButton?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const CourseList: React.FC<CourseListProps> = ({
  courses,
  isLoading = false,
  onViewDetails,
  onEnroll,
  showEnrollButton = true,
  page = 1,
  totalPages = 1,
  onPageChange,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (courses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No courses found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid>
            <CourseCard
              course={course}
              onViewDetails={onViewDetails}
              onEnroll={onEnroll}
              showEnrollButton={showEnrollButton}
            />
          </Grid>
        ))}
      </Grid>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => onPageChange?.(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default CourseList;
