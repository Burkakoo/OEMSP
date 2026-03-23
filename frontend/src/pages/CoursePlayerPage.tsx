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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchCourse, clearCurrentCourse } from '@store/slices/courseSlice';
import { fetchEnrollments } from '@store/slices/enrollmentSlice';
import ModuleList from '@components/courses/ModuleList';
import LessonList from '@components/courses/LessonList';
import AttachmentList from '@components/courses/AttachmentList';
import { courseService } from '@services/course.service';
import { enrollmentService } from '@services/enrollment.service';

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

        if (!isMounted || !enrollment) return;

        setEnrollmentId(enrollment._id);

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

  const handlePlayLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);

    // Ensure we have a progress entry for this lesson (legacy enrollments may not). The
    // actual updates will happen via the timer effect below.
    if (!lessonProgressMapRef.current[lessonId]) {
      updateLessonProgressState(lessonId, { completed: false, timeSpent: 0 });
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
  }, [selectedLessonId, enrollmentId, flushLessonProgress]);

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
                />
              </Paper>
            )}

            {selectedLesson && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {selectedLesson.title}
                </Typography>
                {selectedLesson.videoUrl && (
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
                <Typography variant="body1" paragraph>
                  {selectedLesson.content}
                </Typography>
                {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
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
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CoursePlayerPage;
