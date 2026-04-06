/**
 * Lesson list component
 */

import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Lesson } from '@/types/course.types';

interface LessonListProps {
  lessons: Lesson[];
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onPlay?: (lessonId: string) => void;
  showActions?: boolean;
  selectedLessonId?: string | null;
  isLessonLocked?: (lesson: Lesson) => boolean;
  getLessonStatusLabel?: (lesson: Lesson) => string | undefined;
}

const LessonList: React.FC<LessonListProps> = ({
  lessons,
  onEdit,
  onDelete,
  onPlay,
  showActions = false,
  selectedLessonId,
  isLessonLocked,
  getLessonStatusLabel,
}) => {
  if (lessons.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No lessons available yet.</Typography>
      </Paper>
    );
  }

  return (
    <List>
      {lessons.map((lesson, index) => (
        <ListItem
          key={lesson._id}
          sx={{
            border: 1,
            borderColor: selectedLessonId === lesson._id ? 'primary.main' : 'divider',
            bgcolor: selectedLessonId === lesson._id ? 'action.selected' : undefined,
            borderRadius: 1,
            mb: 1,
            cursor: onPlay ? 'pointer' : 'default',
            '&:hover': onPlay ? { bgcolor: 'action.hover' } : {},
          }}
          onClick={() => onPlay?.(lesson._id)}
          secondaryAction={
            showActions && (
              <Box>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(lesson._id);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(lesson._id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            )
          }
        >
          <Box sx={{ mr: 2 }}>
            {lesson.videoUrl && <PlayCircleOutlineIcon color="primary" />}
          </Box>
          <ListItemText
            primary={`${index + 1}. ${lesson.title}`}
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {lesson.content.length > 100
                    ? `${lesson.content.substring(0, 100)}...`
                    : lesson.content}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label={`${lesson.duration} min`} size="small" />
                  {lesson.isDripEnabled && (
                    <Chip
                      label={getLessonStatusLabel?.(lesson) ?? `Drips after ${lesson.dripDelayDays} day(s)`}
                      size="small"
                      color={isLessonLocked?.(lesson) ? 'warning' : 'default'}
                      variant={isLessonLocked?.(lesson) ? 'filled' : 'outlined'}
                    />
                  )}
                  {lesson.attachments && lesson.attachments.length > 0 && (
                    <Chip
                      label={`${lesson.attachments.length} attachment(s)`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default LessonList;
