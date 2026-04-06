/**
 * Course details component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Course } from '@/types/course.types';
import { getCourseIcon, getCourseBackgroundColor } from '@/utils/courseIcons';
import { getCourseDisplayPrice } from '@/utils/coursePricing';
import { formatLessonAvailabilityLabel } from '@/utils/lessonAvailability';
import { useLocalization } from '@/context/LocalizationContext';

interface CourseDetailsProps {
  course: Course;
  onEnroll?: () => void;
  showEnrollButton?: boolean;
  isEnrolled?: boolean;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({
  course,
  onEnroll,
  showEnrollButton = true,
  isEnrolled = false,
}) => {
  const navigate = useNavigate();
  const { locale, t } = useLocalization();
  const isFreeCourse = course.isFree;
  const priceDisplay = getCourseDisplayPrice(course, { locale });

  const handleGoToCourse = () => {
    navigate(`/courses/${course._id}/learn`);
  };

  const handleEnroll = () => {
    onEnroll?.();
  };
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {course.title}
            </Typography>
            {course.instructor && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {t('byInstructor', {
                  name: `${course.instructor.firstName} ${course.instructor.lastName}`,
                })}
              </Typography>
            )}
            {isFreeCourse && (
              <Chip label={t('free')} color="success" sx={{ mt: 1 }} />
            )}
          </Box>
          {showEnrollButton && !isEnrolled && (
            <Button variant="contained" size="large" onClick={handleEnroll}>
              {t('enrollNow')} - {isFreeCourse ? t('free') : priceDisplay.currentPriceLabel}
            </Button>
          )}
          {isEnrolled && (
            <Button variant="contained" size="large" color="primary" onClick={handleGoToCourse}>
              {t('goToCourse')}
            </Button>
          )}
        </Box>

        {/* Course thumbnail with background icon */}
        <Box
          sx={{
            position: 'relative',
            height: 200,
            mb: 3,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: getCourseBackgroundColor(course.category),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {course.thumbnail ? (
            <Box
              component="img"
              src={course.thumbnail}
              alt={course.title}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : null}
          {/* Background icon overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '6rem',
              opacity: course.thumbnail ? 0.2 : 0.6,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {getCourseIcon(course.category)}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={course.category} color="primary" />
          <Chip label={course.level} />
          {course.isPublished ? (
            <Chip label={t('published')} color="success" variant="outlined" />
          ) : (
            <Chip label={t('draft')} color="warning" variant="outlined" />
          )}
        </Box>

        <Typography variant="body1" paragraph>
          {course.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          {!isFreeCourse && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('price')}
              </Typography>
              <Typography variant="h6">
                {priceDisplay.currentPriceLabel}
              </Typography>
              {priceDisplay.hasDiscount && (
                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  {priceDisplay.originalPriceLabel}
                </Typography>
              )}
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('studentsEnrolled')}
            </Typography>
            <Typography variant="h6">{course.enrollmentCount}</Typography>
          </Box>
          {course.rating && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('rating')}
              </Typography>
              <Typography variant="h6">⭐ {course.rating.toFixed(1)}</Typography>
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('modules')}
            </Typography>
            <Typography variant="h6">{course.modules.length}</Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('courseContent')}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {course.modules.length === 0 ? (
          <Typography color="text.secondary">{t('noModules')}</Typography>
        ) : (
          course.modules.map((module: any, index: number) => (
            <Accordion key={module._id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Module {index + 1}: {module.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {module.description}
                </Typography>
                {module.lessons.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('noLessons')}
                  </Typography>
                ) : (
                  <List>
                    {module.lessons.map((lesson: any, lessonIndex: number) => (
                      <ListItem key={lesson._id}>
                        <ListItemText
                          primary={`${lessonIndex + 1}. ${lesson.title}`}
                          secondary={`${`Duration: ${lesson.duration} minutes`}${formatLessonAvailabilityLabel(lesson) ? ` • ${formatLessonAvailabilityLabel(lesson)}` : ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default CourseDetails;
