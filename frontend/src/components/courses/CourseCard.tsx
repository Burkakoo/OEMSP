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
import { enrollmentService } from '@/services/enrollment.service';
import { getCourseDisplayPrice } from '@/utils/coursePricing';
import { useLocalization } from '@/context/LocalizationContext';

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
  const { locale, t } = useLocalization();

  const handleViewDetails = () => {
    onViewDetails?.(course._id);
  };
  const priceDisplay = getCourseDisplayPrice(course, { locale });

  const handleEnroll = async () => {
    const isFreeCourse = course.isFree;
    
    if (isFreeCourse) {
      try {
        await enrollmentService.enrollInFreeCourse(course._id);
        alert('Successfully enrolled in free course!');
        onEnroll?.(course._id);
      } catch (error: any) {
        alert(error.message || 'Failed to enroll in free course');
      }
    } else {
      onEnroll?.(course._id);
    }
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
          {course.isFree && (
            <Chip label={t('free')} size="small" color="success" />
          )}
        </Box>
        {course.instructor && (
          <Typography variant="caption" color="text.secondary">
            {t('byInstructor', {
              name: `${course.instructor.firstName} ${course.instructor.lastName}`,
            })}
          </Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" color="primary">
              {course.isFree ? t('free') : priceDisplay.currentPriceLabel}
            </Typography>
            {priceDisplay.hasDiscount && !course.isFree && (
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                {priceDisplay.originalPriceLabel}
              </Typography>
            )}
          </Box>
          {course.rating && (
            <Typography variant="body2" color="text.secondary">
              ⭐ {course.rating.toFixed(1)}
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={handleViewDetails}>
          {t('viewDetails')}
        </Button>
        {showEnrollButton && (
          <Button size="small" variant="contained" onClick={handleEnroll}>
            {t('enroll')}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default CourseCard;
