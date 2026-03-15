/**
 * Course card component
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  CardActions,
} from '@mui/material';
import { Course } from '@/types/course.types';
import { getCourseIcon, getCourseBackgroundColor } from '@/utils/courseIcons';

interface CourseCardProps {
  course: Course;
  onViewDetails?: (courseId: string) => void;
  onEnroll?: (courseId: string) => void;
  showEnrollButton?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onViewDetails,
  onEnroll,
  showEnrollButton = true,
}) => {
  const handleViewDetails = () => {
    onViewDetails?.(course._id);
  };

  const handleEnroll = () => {
    onEnroll?.(course._id);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={course.thumbnail || 'https://via.placeholder.com/400x200?text=Course'}
          alt={course.title}
          sx={{
            backgroundColor: getCourseBackgroundColor(course.category),
          }}
        />
        {/* Course category icon as background */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '4rem',
            opacity: course.thumbnail ? 0.3 : 0.8, // More visible if no thumbnail
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {getCourseIcon(course.category)}
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2">
          {course.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {course.description.length > 100
            ? `${course.description.substring(0, 100)}...`
            : course.description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip label={course.category} size="small" color="primary" variant="outlined" />
          <Chip label={course.level} size="small" />
        </Box>
        {course.instructor && (
          <Typography variant="caption" color="text.secondary">
            By {course.instructor.firstName} {course.instructor.lastName}
          </Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary">
            {course.currency} {course.price.toFixed(2)}
          </Typography>
          {course.rating && (
            <Typography variant="body2" color="text.secondary">
              ⭐ {course.rating.toFixed(1)}
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={handleViewDetails}>
          View Details
        </Button>
        {showEnrollButton && (
          <Button size="small" variant="contained" onClick={handleEnroll}>
            Enroll
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default CourseCard;
