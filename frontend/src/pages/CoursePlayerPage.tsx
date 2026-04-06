/**
 * Course player page for enrolled students
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchCourse, clearCurrentCourse } from '@store/slices/courseSlice';
import { fetchEnrollments } from '@store/slices/enrollmentSlice';
import AssignmentSubmissionCard from '@components/assignments/AssignmentSubmissionCard';
import ModuleList from '@components/courses/ModuleList';
import LessonList from '@components/courses/LessonList';
import AttachmentList from '@components/courses/AttachmentList';
import { assignmentService } from '@services/assignment.service';
import { courseService } from '@services/course.service';
import { enrollmentService } from '@services/enrollment.service';
import { AssignmentSubmission } from '@/types/assignment.types';
import { formatLessonAvailabilityLabel, getLessonAvailability } from '@/utils/lessonAvailability';

type ParsedVideoSource =
  | { type: 'youtube' | 'vimeo'; embedUrl: string }
  | { type: 'direct'; url: string };

const parseTimestampToSeconds = (value: string | null): number | null => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;

  return total > 0 ? total : null;
};

const getYouTubeEmbedUrl = (url: URL): string | null => {
  const host = url.hostname.toLowerCase();
  let videoId: string | null = null;

  if (host.includes('youtu.be')) {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (host.includes('youtube.com')) {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v');
    } else if (url.pathname.startsWith('/embed/')) {
      videoId = url.pathname.split('/embed/')[1]?.split('/')[0] ?? null;
    } else if (url.pathname.startsWith('/shorts/')) {
      videoId = url.pathname.split('/shorts/')[1]?.split('/')[0] ?? null;
    }
  }

  if (!videoId) return null;

  const startAt =
    parseTimestampToSeconds(url.searchParams.get('t')) ??
    parseTimestampToSeconds(url.searchParams.get('start'));

  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
  if (startAt !== null) {
    embedUrl.searchParams.set('start', String(startAt));
  }

  return embedUrl.toString();
};

const getVimeoEmbedUrl = (url: URL): string | null => {
  if (!url.hostname.toLowerCase().includes('vimeo.com')) return null;

  const pathSegments = url.pathname.split('/').filter(Boolean);
  const videoId = pathSegments.find((segment) => /^\d+$/.test(segment));

  if (!videoId) return null;

  return `https://player.vimeo.com/video/${videoId}`;
};

const parseVideoSource = (videoUrl: string): ParsedVideoSource | null => {
  const normalizedUrl = videoUrl.trim();
  if (!normalizedUrl) return null;

  try {
    const parsed = new URL(normalizedUrl);
    const youtubeEmbed = getYouTubeEmbedUrl(parsed);
    if (youtubeEmbed) {
      return { type: 'youtube', embedUrl: youtubeEmbed };
    }

    const vimeoEmbed = getVimeoEmbedUrl(parsed);
    if (vimeoEmbed) {
      return { type: 'vimeo', embedUrl: vimeoEmbed };
    }

    return { type: 'direct', url: normalizedUrl };
  } catch {
    return null;
  }
};

const CoursePlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCourse, isLoading } = useAppSelector((state) => state.courses);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
  const [assignmentSubmission, setAssignmentSubmission] = useState<AssignmentSubmission | null>(null);
  const [assignmentDraftText, setAssignmentDraftText] = useState('');
  const [assignmentPendingFiles, setAssignmentPendingFiles] = useState<File[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, { completed: boolean; timeSpent: number }>>({});
  const lessonProgressMapRef = useRef<typeof lessonProgressMap>(lessonProgressMap);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const isMountedRef = useRef<boolean>(true);

  const updateLessonProgressState = (
    lessonId: string,
    entry: { completed: boolean; timeSpent: number }
  ) => {
    setLessonProgressMap((prev) => {
      const next = { ...prev, [lessonId]: entry };
      lessonProgressMapRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchCourse(id));
    }

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (currentCourse && currentCourse.modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(currentCourse.modules[0]._id);
    }
  }, [currentCourse, selectedModuleId]);

  useEffect(() => {
    if (!currentCourse || !selectedModuleId) {
      setSelectedLessonId(null);
      return;
    }

    const module = currentCourse.modules.find((m: any) => m._id === selectedModuleId);
    if (!module || module.lessons.length === 0) {
      setSelectedLessonId(null);
      return;
    }

    const lessonExists = module.lessons.some((lesson: any) => lesson._id === selectedLessonId);
    if (!lessonExists) {
      setSelectedLessonId(module.lessons[0]._id);
    }
  }, [currentCourse, selectedModuleId, selectedLessonId]);

  useEffect(() => {
    let isMounted = true;

    const loadEnrollmentProgress = async () => {
      if (!id) return;

      setEnrollmentId(null);

      try {
        const response = await enrollmentService.getEnrollments({
          courseId: id,
          page: 1,
          limit: 1,
        });
        const enrollment = response.data.enrollments[0];

        if (!isMounted || !enrollment) {
          setEnrolledAt(null);
          return;
        }

        setEnrollmentId(enrollment._id);
        setEnrolledAt(enrollment.enrolledAt);

        const progressMap: Record<string, { completed: boolean; timeSpent: number }> = {};
        enrollment.lessonProgress.forEach((progress) => {
          progressMap[progress.lessonId] = {
            completed: Boolean(progress.completed),
            timeSpent: Number(progress.timeSpent ?? 0),
          };
        });

        setLessonProgressMap(progressMap);
        lessonProgressMapRef.current = progressMap;

      } catch (error) {
        console.error('Failed to load enrollment progress:', error);
        setEnrolledAt(null);
      }
    };

    loadEnrollmentProgress();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const blob = await courseService.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    }
  };

  const handleDownloadAssignmentAttachment = async (attachmentId: string, fileName: string) => {
    if (!assignmentSubmission) return;

    try {
      const blob = await assignmentService.downloadAttachment(assignmentSubmission._id, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setAssignmentError((error as Error).message || 'Failed to download assignment attachment');
    }
  };

  const handlePlayLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);

    // Ensure we have a progress entry for this lesson (legacy enrollments may not). The
    // actual updates will happen via the timer effect below.
    if (!lessonProgressMapRef.current[lessonId]) {
      updateLessonProgressState(lessonId, { completed: false, timeSpent: 0 });
    }
  };

  const handleAssignmentFilesSelected = (files: FileList | null) => {
    if (!files) return;

    setAssignmentPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleRemoveAssignmentFile = (index: number) => {
    setAssignmentPendingFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmitAssignment = async () => {
    const module = currentCourse?.modules.find((item: any) => item._id === selectedModuleId);
    const lesson = module?.lessons.find((item: any) => item._id === selectedLessonId);

    if (!currentCourse || !module || !lesson) {
      return;
    }

    if (getLessonAvailability(lesson, enrolledAt).isLocked) {
      setAssignmentError('This assignment is not available yet.');
      return;
    }

    setAssignmentSubmitting(true);
    setAssignmentError(null);

    try {
      const response = await assignmentService.submitAssignment({
        courseId: currentCourse._id,
        moduleId: module._id,
        lessonId: lesson._id,
        submissionText: assignmentDraftText,
        attachments: assignmentPendingFiles,
      });

      setAssignmentSubmission(response.data);
      setAssignmentDraftText(response.data.submissionText ?? '');
      setAssignmentPendingFiles([]);

      if (enrollmentId) {
        const previousProgress = lessonProgressMapRef.current[lesson._id] ?? {
          completed: false,
          timeSpent: 0,
        };
        const nextTimeSpent = Math.max(previousProgress.timeSpent, (lesson.duration ?? 0) * 60);

        try {
          const progressResponse = await enrollmentService.updateProgress(enrollmentId, {
            lessonId: lesson._id,
            completed: true,
            timeSpent: nextTimeSpent,
          });

          const updatedProgress = progressResponse.data.lessonProgress.find(
            (progress) => progress.lessonId === lesson._id
          );

          if (updatedProgress) {
            updateLessonProgressState(lesson._id, {
              completed: Boolean(updatedProgress.completed),
              timeSpent: Number(updatedProgress.timeSpent ?? 0),
            });
          }

          dispatch(fetchEnrollments());
        } catch (error) {
          console.error('Failed to sync assignment completion progress:', error);
        }
      }
    } catch (error) {
      setAssignmentError((error as Error).message || 'Failed to submit assignment');
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const flushLessonProgress = React.useCallback(
    async (lessonId: string, force = false) => {
      if (!enrollmentId) return;

      const lesson = currentCourse?.modules
        .flatMap((m: any) => m.lessons)
        .find((l: any) => l._id === lessonId);
      if (!lesson) return;

      if (!isMountedRef.current) return;

      const progressEntry = lessonProgressMapRef.current[lessonId] ?? {
        completed: false,
        timeSpent: 0,
      };

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastTickRef.current) / 1000);
      if (elapsedSeconds <= 0 && !force) {
        return;
      }

      lastTickRef.current = now;

      const baseTimeSpent = progressEntry.timeSpent;
      const newTimeSpent = baseTimeSpent + elapsedSeconds;

      const durationSeconds = (lesson.duration ?? 0) * 60;
      const shouldComplete = durationSeconds > 0 ? newTimeSpent >= durationSeconds : progressEntry.completed;
      const finalTimeSpent = durationSeconds > 0 ? Math.min(newTimeSpent, durationSeconds) : newTimeSpent;

      if (!force && progressEntry.completed === shouldComplete && progressEntry.timeSpent === finalTimeSpent) {
        return;
      }

      if (isMountedRef.current) {
        updateLessonProgressState(lessonId, { completed: shouldComplete, timeSpent: finalTimeSpent });
      }

      try {
        const response = await enrollmentService.updateProgress(enrollmentId, {
          lessonId,
          completed: shouldComplete,
          timeSpent: finalTimeSpent,
        });

        const updatedProgress = response.data.lessonProgress.find((p) => p.lessonId === lessonId);
        if (updatedProgress && isMountedRef.current) {
          updateLessonProgressState(lessonId, {
            completed: Boolean(updatedProgress.completed),
            timeSpent: Number(updatedProgress.timeSpent ?? 0),
          });
        }

        if (isMountedRef.current) {
          dispatch(fetchEnrollments());
        }
      } catch (error) {
        console.error('Failed to update lesson progress:', error);
      }
    },
    [currentCourse, dispatch, enrollmentId]
  );

  useEffect(() => {
    if (!selectedLessonId || !enrollmentId) {
      return;
    }

    const lesson = currentCourse?.modules
      .flatMap((module: any) => module.lessons)
      .find((candidate: any) => candidate._id === selectedLessonId);

    if (lesson && getLessonAvailability(lesson, enrolledAt).isLocked) {
      return;
    }

    lastTickRef.current = Date.now();

    // Flush immediately so that any time spent before the interval tick is recorded.
    flushLessonProgress(selectedLessonId, true);

    // Don't start the timer if the lesson is already completed.
    if (lessonProgressMapRef.current[selectedLessonId]?.completed) {
      return;
    }

    progressIntervalRef.current = setInterval(() => {
      flushLessonProgress(selectedLessonId);
    }, 10000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Flush one last time on lesson switch / unmount.
      flushLessonProgress(selectedLessonId, true);
    };
  }, [currentCourse, enrolledAt, selectedLessonId, enrollmentId, flushLessonProgress]);

  useEffect(() => {
    let active = true;

    const loadAssignmentSubmission = async () => {
      const module = currentCourse?.modules.find((item: any) => item._id === selectedModuleId);
      const lesson = module?.lessons.find((item: any) => item._id === selectedLessonId);

      if (
        !currentCourse ||
        !module ||
        !lesson ||
        lesson.type !== 'assignment' ||
        getLessonAvailability(lesson, enrolledAt).isLocked
      ) {
        if (active) {
          setAssignmentSubmission(null);
          setAssignmentDraftText('');
          setAssignmentPendingFiles([]);
          setAssignmentError(null);
          setAssignmentLoading(false);
        }
        return;
      }

      setAssignmentLoading(true);
      setAssignmentError(null);

      try {
        const submission = await assignmentService.getMyAssignmentSubmission(
          currentCourse._id,
          lesson._id
        );
        if (!active) return;
        setAssignmentSubmission(submission);
        setAssignmentDraftText(submission?.submissionText ?? '');
        setAssignmentPendingFiles([]);
      } catch (error) {
        if (!active) return;
        setAssignmentSubmission(null);
        setAssignmentDraftText('');
        setAssignmentPendingFiles([]);
        setAssignmentError((error as Error).message || 'Failed to load assignment submission');
      } finally {
        if (active) {
          setAssignmentLoading(false);
        }
      }
    };

    loadAssignmentSubmission();

    return () => {
      active = false;
    };
  }, [currentCourse, enrolledAt, selectedLessonId, selectedModuleId]);

  if (isLoading) {
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
          <Button onClick={handleBack}>Back to Dashboard</Button>
        </Box>
      </Container>
    );
  }

  const selectedModule = currentCourse.modules.find((m: any) => m._id === selectedModuleId);
  const selectedLesson = selectedModule?.lessons.find((l: any) => l._id === selectedLessonId);
  const selectedLessonAvailability = selectedLesson
    ? getLessonAvailability(selectedLesson, enrolledAt)
    : { isLocked: false };
  const isSelectedLessonLocked = Boolean(selectedLessonAvailability.isLocked);
  const parsedVideoSource = selectedLesson?.videoUrl
    ? parseVideoSource(selectedLesson.videoUrl)
    : null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>

        <Typography variant="h4" gutterBottom>
          {currentCourse.title}
        </Typography>

        <Grid container spacing={3}>
          <Grid>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Course Content
              </Typography>
              <ModuleList
                modules={currentCourse.modules}
                onSelectModule={setSelectedModuleId}
              />
            </Paper>
          </Grid>

          <Grid>
            {selectedModule && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {selectedModule.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedModule.description}
                </Typography>
                <LessonList
                  lessons={selectedModule.lessons}
                  onPlay={handlePlayLesson}
                  selectedLessonId={selectedLessonId}
                  isLessonLocked={(lesson) => getLessonAvailability(lesson, enrolledAt).isLocked}
                  getLessonStatusLabel={(lesson) => formatLessonAvailabilityLabel(lesson, enrolledAt)}
                />
              </Paper>
            )}

            {selectedLesson && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h5">
                    {selectedLesson.title}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      navigate(
                        `/courses/${currentCourse._id}/discussions${selectedLessonId ? `?lessonId=${selectedLessonId}` : ''}`
                      )
                    }
                  >
                    Discuss This Lesson
                  </Button>
                </Box>
                {isSelectedLessonLocked && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    This lesson unlocks on{' '}
                    {selectedLessonAvailability.availableAt
                      ? selectedLessonAvailability.availableAt.toLocaleString()
                      : `day ${selectedLesson.dripDelayDays} after enrollment`}
                    .
                  </Alert>
                )}
                {!isSelectedLessonLocked && selectedLesson.videoUrl && (
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        position: 'relative',
                        pt: '56.25%',
                        bgcolor: 'black',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      {parsedVideoSource?.type === 'direct' && (
                        <Box
                          component="video"
                          controls
                          preload="metadata"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            bgcolor: 'black',
                          }}
                        >
                          <source src={parsedVideoSource.url} />
                          Your browser does not support the video tag.
                        </Box>
                      )}

                      {(parsedVideoSource?.type === 'youtube' ||
                        parsedVideoSource?.type === 'vimeo') && (
                        <Box
                          component="iframe"
                          src={parsedVideoSource.embedUrl}
                          title={selectedLesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                          }}
                        />
                      )}

                      {!parsedVideoSource && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                          }}
                        >
                          <Typography color="white" align="center">
                            Unable to load this video URL.
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      If playback fails, open the video directly:
                      {' '}
                      <a href={selectedLesson.videoUrl} target="_blank" rel="noopener noreferrer">
                        {selectedLesson.videoUrl}
                      </a>
                    </Typography>
                  </Box>
                )}
                {!isSelectedLessonLocked && (
                  <Typography variant="body1" paragraph>
                    {selectedLesson.content}
                  </Typography>
                )}
                {!isSelectedLessonLocked && selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Attachments
                    </Typography>
                    <AttachmentList
                      attachments={selectedLesson.attachments}
                      onDownload={handleDownloadAttachment}
                    />
                  </Box>
                )}
                {!isSelectedLessonLocked && selectedLesson.type === 'assignment' && (
                  <Box sx={{ mt: 3 }}>
                    <AssignmentSubmissionCard
                      submission={assignmentSubmission}
                      draftText={assignmentDraftText}
                      pendingFiles={assignmentPendingFiles}
                      isLoading={assignmentLoading}
                      isSubmitting={assignmentSubmitting}
                      error={assignmentError}
                      onTextChange={setAssignmentDraftText}
                      onFilesSelected={handleAssignmentFilesSelected}
                      onRemovePendingFile={handleRemoveAssignmentFile}
                      onSubmit={handleSubmitAssignment}
                      onDownloadAttachment={handleDownloadAssignmentAttachment}
                    />
                  </Box>
                )}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CoursePlayerPage;
