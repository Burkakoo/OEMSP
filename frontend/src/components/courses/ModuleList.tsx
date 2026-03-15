/**
 * Module list component
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Module } from '@/types/course.types';

interface ModuleListProps {
  modules: Module[];
  onEdit?: (moduleId: string) => void;
  onDelete?: (moduleId: string) => void;
  onSelectModule?: (moduleId: string) => void;
  showActions?: boolean;
}

const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  onEdit,
  onDelete,
  onSelectModule,
  showActions = false,
}) => {
  if (modules.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No modules available yet.</Typography>
      </Paper>
    );
  }

  return (
    <List>
      {modules.map((module, index) => (
        <ListItem
          key={module._id}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            cursor: onSelectModule ? 'pointer' : 'default',
            '&:hover': onSelectModule ? { bgcolor: 'action.hover' } : {},
          }}
          onClick={() => onSelectModule?.(module._id)}
          secondaryAction={
            showActions && (
              <Box>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(module._id);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(module._id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            )
          }
        >
          <ListItemText
            primary={`Module ${index + 1}: ${module.title}`}
            secondary={
              <>
                <Typography variant="body2" color="text.secondary">
                  {module.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {module.lessons.length} lesson(s)
                </Typography>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ModuleList;
