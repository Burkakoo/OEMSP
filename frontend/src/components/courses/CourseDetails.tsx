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
  const isFreeCourse = course.isFree;

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
                By {course.instructor.firstName} {course.instructor.lastName}
              </Typography>
            )}
            {isFreeCourse && (
              <Chip label="FREE" color="success" sx={{ mt: 1 }} />
            )}
          </Box>
          {showEnrollButton && !isEnrolled && (
            <Button variant="contained" size="large" onClick={handleEnroll}>
              Enroll Now - {isFreeCourse ? 'FREE' : `${course.currency} ${course.price.toFixed(2)}`}
            </Button>
          )}
          {isEnrolled && (
            <Button variant="contained" size="large" color="primary" onClick={handleGoToCourse}>
              Go to Course
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
            <Chip label="Published" color="success" variant="outlined" />
          ) : (
            <Chip label="Draft" color="warning" variant="outlined" />
          )}
        </Box>

        <Typography variant="body1" paragraph>
          {course.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Students Enrolled
            </Typography>
            <Typography variant="h6">{course.enrollmentCount}</Typography>
          </Box>
          {course.rating && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Rating
              </Typography>
              <Typography variant="h6">⭐ {course.rating.toFixed(1)}</Typography>
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Modules
            </Typography>
            <Typography variant="h6">{course.modules.length}</Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Course Content
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {course.modules.length === 0 ? (
          <Typography color="text.secondary">No modules available yet.</Typography>
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
                    No lessons available yet.
                  </Typography>
                ) : (
                  <List>
                    {module.lessons.map((lesson: any, lessonIndex: number) => (
                      <ListItem key={lesson._id}>
                        <ListItemText
                          primary={`${lessonIndex + 1}. ${lesson.title}`}
                          secondary={`Duration: ${lesson.duration} minutes`}
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
