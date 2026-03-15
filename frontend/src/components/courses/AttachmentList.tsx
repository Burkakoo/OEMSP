/**
 * Attachment list component with download links
 */

import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Attachment } from '@/types/course.types';

interface AttachmentListProps {
  attachments: Attachment[];
  onDownload: (attachmentId: string, fileName: string) => void;
}

const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, onDownload }) => {
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <PictureAsPdfIcon />;
    if (type.includes('doc')) return <DescriptionIcon />;
    if (type.includes('xls') || type.includes('sheet')) return <TableChartIcon />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (attachments.length === 0) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No attachments available
        </Typography>
      </Paper>
    );
  }

  return (
    <List>
      {attachments.map((attachment) => (
        <ListItem
          key={attachment._id}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
          }}
          secondaryAction={
            <IconButton
              edge="end"
              aria-label="download"
              onClick={() => onDownload(attachment._id, attachment.fileName)}
            >
              <DownloadIcon />
            </IconButton>
          }
        >
          <ListItemIcon>{getFileIcon(attachment.fileType)}</ListItemIcon>
          <ListItemText
            primary={attachment.fileName}
            secondary={
              <>
                <Typography variant="caption" component="span" color="text.secondary">
                  {formatFileSize(attachment.fileSize)}
                </Typography>
                {' • '}
                <Typography variant="caption" component="span" color="text.secondary">
                  {new Date(attachment.uploadedAt).toLocaleDateString()}
                </Typography>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default AttachmentList;
