/**
 * Edit course page (instructor only)
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Button,
  CircularProgress,
  Typography,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchCourse, updateCourse, publishCourse, unpublishCourse, clearCurrentCourse } from '@store/slices/courseSlice';
import CourseForm from '@components/courses/CourseForm';
import ModuleList from '@components/courses/ModuleList';
import LessonList from '@components/courses/LessonList';
import { courseService } from '@services/course.service';
import { CreateLessonData, CreateModuleData, LessonType, UpdateCourseData } from '@/types/course.types';

const EditCoursePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCourse, isLoading, error } = useAppSelector((state) => state.courses);

  const [tabValue, setTabValue] = React.useState(0);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = React.useState<string | null>(null);

  const [isAddModuleOpen, setIsAddModuleOpen] = React.useState(false);
  const [isAddingModule, setIsAddingModule] = React.useState(false);
  const [newModule, setNewModule] = React.useState<CreateModuleData>({
    title: '',
    description: '',
    order: 1,
  });
  const [moduleErrors, setModuleErrors] = React.useState<Record<string, string>>({});

  const [isAddLessonOpen, setIsAddLessonOpen] = React.useState(false);
  const [isAddingLesson, setIsAddingLesson] = React.useState(false);
  const [newLesson, setNewLesson] = React.useState<CreateLessonData>({
    title: '',
    description: '',
    type: 'video',
    content: '',
    videoUrl: '',
    duration: 10,
    order: 1,
  });
  const [lessonErrors, setLessonErrors] = React.useState<Record<string, string>>({});
  const [uploadLessonId, setUploadLessonId] = React.useState<string>('');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);
  const [uploadInputKey, setUploadInputKey] = React.useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourse(id));
    }

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [dispatch, id]);

  const handleSubmit = async (data: UpdateCourseData) => {
    if (!id) return;

    setPageError(null);
    try {
      await dispatch(updateCourse({ id, data })).unwrap();
    } catch (error) {
      const message =
        typeof error === 'string' ? error : (error as any)?.message || 'Failed to update course';
      setPageError(message);
    }
  };

  const handleCancel = () => {
    navigate('/instructor/courses');
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (currentCourse && currentCourse.modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(currentCourse.modules[0]._id);
    }
  }, [currentCourse, selectedModuleId]);

  useEffect(() => {
    if (!currentCourse || !selectedModuleId) {
      setUploadLessonId('');
      return;
    }
    const module = currentCourse.modules.find((m) => m._id === selectedModuleId);
    if (!module || module.lessons.length === 0) {
      setUploadLessonId('');
      return;
    }
    if (!uploadLessonId || !module.lessons.some((l) => l._id === uploadLessonId)) {
      setUploadLessonId(module.lessons[0]._id);
    }
  }, [currentCourse, selectedModuleId, uploadLessonId]);

  const openAddModule = () => {
    if (!currentCourse) return;
    setModuleErrors({});
    setNewModule({
      title: '',
      description: '',
      order: (currentCourse.modules?.length ?? 0) + 1,
    });
    setIsAddModuleOpen(true);
  };

  const validateModule = (): boolean => {
    const errs: Record<string, string> = {};
    const title = newModule.title.trim();
    const description = newModule.description.trim();

    if (!title) errs.title = 'Module title is required';
    else if (title.length < 2) errs.title = 'Module title must be at least 2 characters';

    if (!description) errs.description = 'Module description is required';
    else if (description.length < 10) errs.description = 'Module description must be at least 10 characters';

    if (Number.isNaN(newModule.order)) errs.order = 'Order is required';
    else if (newModule.order < 0) errs.order = 'Order cannot be negative';

    setModuleErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAddModule = async () => {
    if (!id || !currentCourse) return;
    if (!validateModule()) return;

    setPageError(null);
    setIsAddingModule(true);

    try {
      const payload: CreateModuleData = {
        title: newModule.title.trim(),
        description: newModule.description.trim(),
        order: Number(newModule.order),
      };

      const resp = await courseService.addModule(currentCourse._id, payload);
      setIsAddModuleOpen(false);
      if (resp?.module?._id) setSelectedModuleId(resp.module._id);
      await dispatch(fetchCourse(id)).unwrap();
    } catch (err) {
      const message =
        typeof err === 'string' ? err : (err as any)?.message || 'Failed to add module';
      setPageError(message);
    } finally {
      setIsAddingModule(false);
    }
  };

  const openAddLesson = () => {
    if (!currentCourse || !selectedModuleId) return;

    const selectedModule = currentCourse.modules.find((m) => m._id === selectedModuleId);
    const nextOrder = (selectedModule?.lessons?.length ?? 0) + 1;

    setLessonErrors({});
    setNewLesson({
      title: '',
      description: '',
      type: 'video',
      content: '',
      videoUrl: '',
      duration: 10,
      order: nextOrder,
    });
    setIsAddLessonOpen(true);
  };

  const validateLesson = (): boolean => {
    const errs: Record<string, string> = {};

    const title = newLesson.title.trim();
    const description = newLesson.description.trim();
    const content = newLesson.content.trim();
    const videoUrl = (newLesson.videoUrl ?? '').trim();

    if (!title) errs.title = 'Lesson title is required';
    else if (title.length < 2) errs.title = 'Lesson title must be at least 2 characters';

    if (!description) errs.description = 'Lesson description is required';
    else if (description.length < 10) errs.description = 'Lesson description must be at least 10 characters';

    if (!newLesson.type) errs.type = 'Lesson type is required';

    if (!content) errs.content = 'Lesson content is required';

    if (Number.isNaN(newLesson.duration)) errs.duration = 'Duration is required';
    else if (newLesson.duration < 0) errs.duration = 'Duration cannot be negative';

    if (Number.isNaN(newLesson.order)) errs.order = 'Order is required';
    else if (newLesson.order < 0) errs.order = 'Order cannot be negative';

    if (videoUrl.length > 0 && !/^https?:\/\/.*$/i.test(videoUrl)) {
      errs.videoUrl = 'Video URL must start with http:// or https://';
    }

    setLessonErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAddLesson = async () => {
    if (!id || !currentCourse || !selectedModuleId) return;
    if (!validateLesson()) return;

    setPageError(null);
    setIsAddingLesson(true);

    try {
      const videoUrl = (newLesson.videoUrl ?? '').trim();
      const payload: CreateLessonData = {
        title: newLesson.title.trim(),
        description: newLesson.description.trim(),
        type: newLesson.type,
        content: newLesson.content.trim(),
        videoUrl: videoUrl.length > 0 ? videoUrl : undefined,
        duration: Number(newLesson.duration),
        order: Number(newLesson.order),
      };

      await courseService.addLesson(currentCourse._id, selectedModuleId, payload);
      setIsAddLessonOpen(false);
      await dispatch(fetchCourse(id)).unwrap();
    } catch (err) {
      const message =
        typeof err === 'string' ? err : (err as any)?.message || 'Failed to add lesson';
      setPageError(message);
    } finally {
      setIsAddingLesson(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!id || !currentCourse) return;

    setPageError(null);
    try {
      if (currentCourse.isPublished) {
        await dispatch(unpublishCourse(id)).unwrap();
      } else {
        await dispatch(publishCourse(id)).unwrap();
      }
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : (err as any)?.message ||
            (currentCourse.isPublished ? 'Failed to unpublish course' : 'Failed to publish course');
      setPageError(message);
    }
  };

  // ── Delete / Edit Module ──────────────────────────────────────────────────
  const [deletingModuleId, setDeletingModuleId] = React.useState<string | null>(null);
  const [editModuleOpen, setEditModuleOpen] = React.useState(false);
  const [editingModule, setEditingModule] = React.useState<{ id: string; title: string; description: string; order: number } | null>(null);
  const [editModuleErrors, setEditModuleErrors] = React.useState<Record<string, string>>({});
  const [isSavingModule, setIsSavingModule] = React.useState(false);

  const handleDeleteModule = async (moduleId: string) => {
    if (!id || !currentCourse) return;
    if (!window.confirm('Delete this module and all its lessons?')) return;
    setDeletingModuleId(moduleId);
    try {
      await courseService.deleteModule(currentCourse._id, moduleId);
      if (selectedModuleId === moduleId) setSelectedModuleId(null);
      await dispatch(fetchCourse(id)).unwrap();
    } catch (err) {
      setPageError(typeof err === 'string' ? err : (err as any)?.message || 'Failed to delete module');
    } finally {
      setDeletingModuleId(null);
    }
  };

  const handleEditModule = (moduleId: string) => {
    if (!currentCourse) return;
    const mod = currentCourse.modules.find((m) => m._id === moduleId);
    if (!mod) return;
    setEditingModule({ id: moduleId, title: mod.title, description: mod.description, order: mod.order });
    setEditModuleErrors({});
    setEditModuleOpen(true);
  };

  const submitEditModule = async () => {
    if (!id || !currentCourse || !editingModule) return;
    const errs: Record<string, string> = {};
    if (!editingModule.title.trim()) errs.title = 'Title is required';
    if (!editingModule.description.trim()) errs.description = 'Description is required';
    setEditModuleErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSavingModule(true);
    try {
      await courseService.updateModule(currentCourse._id, editingModule.id, {
        title: editingModule.title.trim(),
        description: editingModule.description.trim(),
        order: editingModule.order,
      });
      setEditModuleOpen(false);
      await dispatch(fetchCourse(id)).unwrap();
    } catch (err) {
      setPageError(typeof err === 'string' ? err : (err as any)?.message || 'Failed to update module');
    } finally {
      setIsSavingModule(false);
    }
  };

  // ── Delete / Edit Lesson ──────────────────────────────────────────────────
  const [deletingLessonId, setDeletingLessonId] = React.useState<string | null>(null);
  const [editLessonOpen, setEditLessonOpen] = React.useState(false);
  const [editingLesson, setEditingLesson] = React.useState<any | null>(null);
  const [editLessonErrors, setEditLessonErrors] = React.useState<Record<string, string>>({});
  const [isSavingLesson, setIsSavingLesson] = React.useState(false);

  const handleDeleteLesson = async (lessonId: string) => {
    if (!id || !currentCourse || !selectedModuleId) return;
    if (!window.confirm('Delete this lesson?')) return;
    setDeletingLessonId(lessonId);
    try {
      await courseService.deleteLesson(currentCourse._id, selectedModuleId, lessonId);
      await dispatch(fetchCourse(id)).unwrap();
    } catch (err) {
      setPageError(typeof err === 'string' ? err : (err as any)?.message || 'Failed to delete lesson');
    } finally {
      setDeletingLessonId(null);
    }
  };

  const handleEditLesson = (lessonId: string) => {
    if (!currentCourse || !selectedModuleId) return;
    const mod = currentCourse.modules.find((m) => m._id === selectedModuleId);
    const lesson = mod?.lessons.find((l) => l._id === lessonId);
    if (!lesson) return;
    setEditingLesson({ ...lesson });
    setEditLessonErrors({});
    setEditLessonOpen(true);
  };

  const submitEditLesson = async () => {
    if (!id || !currentCourse || !selectedModuleId || !editingLesson) return;
    const errs: Record<string, string> = {};
    if (!editingLesson.title?.trim()) errs.title = 'Title is required';
    if (!editingLesson.description?.trim()) errs.description = 'Description is required';
    if (!editingLesson.content?.trim()) errs.content = 'Content is required';
    setEditLessonErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSavingLesson(true);
    try {
      await courseService.updateLesson(currentCourse._id, selectedModuleId, editingLesson._id, {
        title: editingLesson.title.trim(),
        description: editingLesson.description.trim(),
        type: editingLesson.type,
        content: editingLesson.content.trim(),
        videoUrl: editingLesson.videoUrl?.trim() || undefined,
        duration: Number(editingLesson.duration),
        order: Number(editingLesson.order),
      });
      setEditLessonOpen(false);
      await dispatch(fetchCourse(id)).unwrap();
    } catch (err) {
      setPageError(typeof err === 'string' ? err : (err as any)?.message || 'Failed to update lesson');
    } finally {
      setIsSavingLesson(false);
    }
  };

  // suppress unused-var warnings for loading states used implicitly
  void deletingModuleId; void deletingLessonId;

  const handleUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      setUploadFile(null);
      return;
    }

    const extension = nextFile.name.includes('.')
      ? nextFile.name.split('.').pop()!.toLowerCase()
      : '';
    const allowed = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'txt'];

    if (!allowed.includes(extension)) {
      setPageError('Unsupported file type. Use pdf, ppt, pptx, doc, docx, xls, xlsx, or txt.');
      setUploadFile(null);
      return;
    }

    setPageError(null);
    setUploadFile(nextFile);
  };

  const handleUploadAttachment = async () => {
    if (!id || !currentCourse || !selectedModuleId || !uploadLessonId || !uploadFile) {
      setPageError('Choose a lesson and file before uploading.');
      return;
    }

    setPageError(null);
    setIsUploadingAttachment(true);
    try {
      await courseService.uploadAttachment(
        currentCourse._id,
        selectedModuleId,
        uploadLessonId,
        uploadFile
      );
      await dispatch(fetchCourse(id)).unwrap();
      setUploadFile(null);
      setUploadInputKey((k) => k + 1);
    } catch (err) {
      const message =
        typeof err === 'string' ? err : (err as any)?.message || 'Failed to upload attachment';
      setPageError(message);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  if (isLoading && !currentCourse) {
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
          <Typography>Course not found</Typography>
          <Button onClick={handleCancel}>Back to My Courses</Button>
        </Box>
      </Container>
    );
  }

  const selectedModule = currentCourse.modules.find((m: any) => m._id === selectedModuleId);
  const effectiveError = pageError ?? error;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/instructor/courses')}>
            Back to My Courses
          </Button>
          <Button
            variant={currentCourse.isPublished ? 'outlined' : 'contained'}
            color={currentCourse.isPublished ? 'warning' : 'success'}
            onClick={handleTogglePublish}
            disabled={isLoading}
          >
            {currentCourse.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        </Box>

        {effectiveError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {effectiveError}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Course Details" />
            <Tab label="Modules & Lessons" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <Paper sx={{ p: 4 }}>
            <CourseForm
              course={currentCourse}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Course Content
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage modules and lessons for your course.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
                alignItems: 'start',
              }}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  Modules
                </Typography>
                <ModuleList
                  modules={currentCourse.modules}
                  onSelectModule={setSelectedModuleId}
                  showActions
                  onDelete={handleDeleteModule}
                  onEdit={handleEditModule}
                />
                <Button variant="outlined" sx={{ mt: 2 }} onClick={openAddModule} disabled={isLoading}>
                  Add Module
                </Button>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Lessons
                </Typography>
                {selectedModule ? (
                  <LessonList
                    lessons={selectedModule.lessons}
                    showActions
                    onDelete={handleDeleteLesson}
                    onEdit={handleEditLesson}
                  />
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">Select a module to view lessons.</Typography>
                  </Paper>
                )}
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={openAddLesson}
                  disabled={isLoading || !selectedModuleId}
                >
                  Add Lesson
                </Button>
                <Button
                  variant="contained"
                  sx={{ mt: 2, ml: 2 }}
                  onClick={() =>
                    navigate(
                      `/courses/${currentCourse._id}/quiz/create?moduleId=${selectedModuleId ?? ''}`
                    )
                  }
                  disabled={!selectedModuleId}
                >
                  Create Quiz
                </Button>

                {selectedModule && selectedModule.lessons.length > 0 && (
                  <Paper sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Upload Lesson Attachment
                    </Typography>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="upload-lesson-select-label">Lesson</InputLabel>
                      <Select
                        labelId="upload-lesson-select-label"
                        value={uploadLessonId}
                        label="Lesson"
                        onChange={(e) => setUploadLessonId(String(e.target.value))}
                      >
                        {selectedModule.lessons.map((lesson) => (
                          <MenuItem key={lesson._id} value={lesson._id}>
                            {lesson.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      <Button component="label" variant="outlined">
                        Choose File
                        <input
                          key={uploadInputKey}
                          hidden
                          type="file"
                          accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt"
                          onChange={handleUploadFileChange}
                        />
                      </Button>
                      {uploadFile ? (
                        <Chip label={uploadFile.name} size="small" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No file selected
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Allowed: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, TXT
                    </Typography>

                    <Button
                      variant="contained"
                      sx={{ mt: 2 }}
                      onClick={handleUploadAttachment}
                      disabled={isUploadingAttachment || !uploadLessonId || !uploadFile}
                    >
                      {isUploadingAttachment ? 'Uploading...' : 'Upload Attachment'}
                    </Button>
                  </Paper>
                )}
              </Box>
            </Box>
          </Paper>
        )}

        <Dialog open={isAddModuleOpen} onClose={() => (isAddingModule ? null : setIsAddModuleOpen(false))} fullWidth maxWidth="sm">
          <DialogTitle>Add Module</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Module Title"
              value={newModule.title}
              onChange={(e) => {
                setNewModule((prev) => ({ ...prev, title: e.target.value }));
                if (moduleErrors.title) setModuleErrors((prev) => ({ ...prev, title: '' }));
              }}
              error={!!moduleErrors.title}
              helperText={moduleErrors.title}
              disabled={isAddingModule}
            />
            <TextField
              margin="normal"
              fullWidth
              multiline
              minRows={3}
              label="Module Description"
              value={newModule.description}
              onChange={(e) => {
                setNewModule((prev) => ({ ...prev, description: e.target.value }));
                if (moduleErrors.description) setModuleErrors((prev) => ({ ...prev, description: '' }));
              }}
              error={!!moduleErrors.description}
              helperText={moduleErrors.description}
              disabled={isAddingModule}
            />
            <TextField
              margin="normal"
              fullWidth
              type="number"
              label="Order"
              value={newModule.order}
              onChange={(e) => {
                setNewModule((prev) => ({ ...prev, order: Number(e.target.value) }));
                if (moduleErrors.order) setModuleErrors((prev) => ({ ...prev, order: '' }));
              }}
              error={!!moduleErrors.order}
              helperText={moduleErrors.order}
              disabled={isAddingModule}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddModuleOpen(false)} disabled={isAddingModule}>
              Cancel
            </Button>
            <Button variant="contained" onClick={submitAddModule} disabled={isAddingModule}>
              {isAddingModule ? 'Adding...' : 'Add Module'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={isAddLessonOpen} onClose={() => (isAddingLesson ? null : setIsAddLessonOpen(false))} fullWidth maxWidth="sm">
          <DialogTitle>Add Lesson</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Lesson Title"
              value={newLesson.title}
              onChange={(e) => {
                setNewLesson((prev) => ({ ...prev, title: e.target.value }));
                if (lessonErrors.title) setLessonErrors((prev) => ({ ...prev, title: '' }));
              }}
              error={!!lessonErrors.title}
              helperText={lessonErrors.title}
              disabled={isAddingLesson}
            />

            <TextField
              margin="normal"
              fullWidth
              multiline
              minRows={2}
              label="Lesson Description"
              value={newLesson.description}
              onChange={(e) => {
                setNewLesson((prev) => ({ ...prev, description: e.target.value }));
                if (lessonErrors.description) setLessonErrors((prev) => ({ ...prev, description: '' }));
              }}
              error={!!lessonErrors.description}
              helperText={lessonErrors.description}
              disabled={isAddingLesson}
            />

            <FormControl fullWidth margin="normal" error={!!lessonErrors.type} disabled={isAddingLesson}>
              <InputLabel id="lesson-type-label">Type</InputLabel>
              <Select
                labelId="lesson-type-label"
                label="Type"
                value={newLesson.type}
                onChange={(e: SelectChangeEvent<LessonType>) => {
                  setNewLesson((prev) => ({ ...prev, type: e.target.value as LessonType }));
                  if (lessonErrors.type) setLessonErrors((prev) => ({ ...prev, type: '' }));
                }}
              >
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="assignment">Assignment</MenuItem>
              </Select>
              {lessonErrors.type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {lessonErrors.type}
                </Typography>
              )}
            </FormControl>

            <TextField
              margin="normal"
              fullWidth
              multiline
              minRows={4}
              label="Content"
              value={newLesson.content}
              onChange={(e) => {
                setNewLesson((prev) => ({ ...prev, content: e.target.value }));
                if (lessonErrors.content) setLessonErrors((prev) => ({ ...prev, content: '' }));
              }}
              error={!!lessonErrors.content}
              helperText={lessonErrors.content}
              disabled={isAddingLesson}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Video URL (optional)"
              value={newLesson.videoUrl ?? ''}
              onChange={(e) => {
                setNewLesson((prev) => ({ ...prev, videoUrl: e.target.value }));
                if (lessonErrors.videoUrl) setLessonErrors((prev) => ({ ...prev, videoUrl: '' }));
              }}
              error={!!lessonErrors.videoUrl}
              helperText={lessonErrors.videoUrl}
              disabled={isAddingLesson}
            />

            <TextField
              margin="normal"
              fullWidth
              type="number"
              label="Duration (minutes)"
              value={newLesson.duration}
              onChange={(e) => {
                setNewLesson((prev) => ({ ...prev, duration: Number(e.target.value) }));
                if (lessonErrors.duration) setLessonErrors((prev) => ({ ...prev, duration: '' }));
              }}
              error={!!lessonErrors.duration}
              helperText={lessonErrors.duration}
              disabled={isAddingLesson}
            />

            <TextField
              margin="normal"
              fullWidth
              type="number"
              label="Order"
              value={newLesson.order}
              onChange={(e) => {
                setNewLesson((prev) => ({ ...prev, order: Number(e.target.value) }));
                if (lessonErrors.order) setLessonErrors((prev) => ({ ...prev, order: '' }));
              }}
              error={!!lessonErrors.order}
              helperText={lessonErrors.order}
              disabled={isAddingLesson}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddLessonOpen(false)} disabled={isAddingLesson}>
              Cancel
            </Button>
            <Button variant="contained" onClick={submitAddLesson} disabled={isAddingLesson}>
              {isAddingLesson ? 'Adding...' : 'Add Lesson'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Edit Module Dialog */}
        <Dialog open={editModuleOpen} onClose={() => isSavingModule ? null : setEditModuleOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Module</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField margin="normal" fullWidth label="Module Title"
              value={editingModule?.title ?? ''}
              onChange={(e) => setEditingModule((p: any) => ({ ...p, title: e.target.value }))}
              error={!!editModuleErrors.title} helperText={editModuleErrors.title}
              disabled={isSavingModule} />
            <TextField margin="normal" fullWidth multiline minRows={3} label="Module Description"
              value={editingModule?.description ?? ''}
              onChange={(e) => setEditingModule((p: any) => ({ ...p, description: e.target.value }))}
              error={!!editModuleErrors.description} helperText={editModuleErrors.description}
              disabled={isSavingModule} />
            <TextField margin="normal" fullWidth type="number" label="Order"
              value={editingModule?.order ?? 1}
              onChange={(e) => setEditingModule((p: any) => ({ ...p, order: Number(e.target.value) }))}
              disabled={isSavingModule} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditModuleOpen(false)} disabled={isSavingModule}>Cancel</Button>
            <Button variant="contained" onClick={submitEditModule} disabled={isSavingModule}>
              {isSavingModule ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Lesson Dialog */}
        <Dialog open={editLessonOpen} onClose={() => isSavingLesson ? null : setEditLessonOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField margin="normal" fullWidth label="Lesson Title"
              value={editingLesson?.title ?? ''}
              onChange={(e) => setEditingLesson((p: any) => ({ ...p, title: e.target.value }))}
              error={!!editLessonErrors.title} helperText={editLessonErrors.title}
              disabled={isSavingLesson} />
            <TextField margin="normal" fullWidth multiline minRows={2} label="Description"
              value={editingLesson?.description ?? ''}
              onChange={(e) => setEditingLesson((p: any) => ({ ...p, description: e.target.value }))}
              error={!!editLessonErrors.description} helperText={editLessonErrors.description}
              disabled={isSavingLesson} />
            <FormControl fullWidth margin="normal" disabled={isSavingLesson}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={editingLesson?.type ?? 'video'}
                onChange={(e) => setEditingLesson((p: any) => ({ ...p, type: e.target.value }))}>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="assignment">Assignment</MenuItem>
              </Select>
            </FormControl>
            <TextField margin="normal" fullWidth multiline minRows={4} label="Content"
              value={editingLesson?.content ?? ''}
              onChange={(e) => setEditingLesson((p: any) => ({ ...p, content: e.target.value }))}
              error={!!editLessonErrors.content} helperText={editLessonErrors.content}
              disabled={isSavingLesson} />
            <TextField margin="normal" fullWidth label="Video URL (optional)"
              value={editingLesson?.videoUrl ?? ''}
              onChange={(e) => setEditingLesson((p: any) => ({ ...p, videoUrl: e.target.value }))}
              disabled={isSavingLesson} />
            <TextField margin="normal" fullWidth type="number" label="Duration (minutes)"
              value={editingLesson?.duration ?? 10}
              onChange={(e) => setEditingLesson((p: any) => ({ ...p, duration: Number(e.target.value) }))}
              disabled={isSavingLesson} />
            <TextField margin="normal" fullWidth type="number" label="Order"
              value={editingLesson?.order ?? 1}
              onChange={(e) => setEditingLesson((p: any) => ({ ...p, order: Number(e.target.value) }))}
              disabled={isSavingLesson} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditLessonOpen(false)} disabled={isSavingLesson}>Cancel</Button>
            <Button variant="contained" onClick={submitEditLesson} disabled={isSavingLesson}>
              {isSavingLesson ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EditCoursePage;
