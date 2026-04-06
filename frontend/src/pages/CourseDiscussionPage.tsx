import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppSelector } from '@hooks/useAppDispatch';
import { courseService } from '@/services/course.service';
import { discussionService } from '@/services/discussion.service';
import { Course } from '@/types/course.types';
import { DiscussionThread } from '@/types/discussion.types';

type FilterValue = 'all' | 'course' | string;

const formatAuthorName = (firstName?: string, lastName?: string) =>
  `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Course member';

const CourseDiscussionPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  const lessonIdFromQuery = searchParams.get('lessonId') || '';

  const [course, setCourse] = React.useState<Course | null>(null);
  const [threads, setThreads] = React.useState<DiscussionThread[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPosting, setIsPosting] = React.useState(false);
  const [replyingThreadId, setReplyingThreadId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [scopeValue, setScopeValue] = React.useState<string>(lessonIdFromQuery || 'course');
  const [filterValue, setFilterValue] = React.useState<FilterValue>(lessonIdFromQuery || 'all');
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>({});

  const loadPage = React.useCallback(async () => {
    if (!courseId) {
      setError('Course ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [courseResponse, discussionResponse] = await Promise.all([
        courseService.getCourse(courseId),
        discussionService.getCourseDiscussions(courseId),
      ]);

      setCourse(courseResponse.data);
      setThreads(discussionResponse.data ?? []);
    } catch (loadError) {
      setError((loadError as Error).message || 'Failed to load course discussions');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const lessonOptions =
    course?.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        moduleId: module._id,
        moduleTitle: module.title,
      }))
    ) ?? [];

  const getLessonMeta = (lessonId?: string) =>
    lessonOptions.find((lesson) => lesson.lessonId === lessonId);

  const visibleThreads = threads.filter((thread) => {
    if (filterValue === 'all') return true;
    if (filterValue === 'course') return !thread.lessonId;
    return !thread.lessonId || thread.lessonId === filterValue;
  });

  const handleBack = () => {
    if (!courseId) {
      navigate('/dashboard');
      return;
    }

    if (user?.role === 'student') {
      navigate(`/courses/${courseId}/learn`);
      return;
    }

    if (user?.role === 'instructor') {
      navigate(`/instructor/courses/${courseId}/edit`);
      return;
    }

    navigate('/dashboard');
  };

  const handleCreateThread = async () => {
    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (trimmedTitle.length < 3) {
      setError('Thread title must be at least 3 characters');
      return;
    }
    if (trimmedContent.length < 5) {
      setError('Thread content must be at least 5 characters');
      return;
    }

    const lessonMeta = scopeValue === 'course' ? undefined : getLessonMeta(scopeValue);

    setIsPosting(true);
    setError(null);

    try {
      const response = await discussionService.createDiscussionThread(courseId, {
        title: trimmedTitle,
        content: trimmedContent,
        moduleId: lessonMeta?.moduleId,
        lessonId: lessonMeta?.lessonId,
      });

      setThreads((prev) => [response.data, ...prev]);
      setTitle('');
      setContent('');
      setScopeValue(lessonIdFromQuery || 'course');
    } catch (postError) {
      setError((postError as Error).message || 'Failed to post discussion thread');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReply = async (threadId: string) => {
    const reply = replyDrafts[threadId]?.trim();
    if (!reply) {
      setError('Reply content cannot be empty');
      return;
    }

    setReplyingThreadId(threadId);
    setError(null);

    try {
      const response = await discussionService.replyToThread(threadId, reply);
      setThreads((prev) =>
        prev.map((thread) => (thread._id === threadId ? response.data : thread))
      );
      setReplyDrafts((prev) => ({ ...prev, [threadId]: '' }));
    } catch (replyError) {
      setError((replyError as Error).message || 'Failed to post reply');
    } finally {
      setReplyingThreadId(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Course Discussions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {course
          ? `Keep questions and answers inside ${course.title}, either course-wide or tied to a specific lesson.`
          : 'Keep questions and answers inside the course, either course-wide or tied to a specific lesson.'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' } }}>
        <Paper sx={{ p: 3, alignSelf: 'start' }}>
          <Typography variant="h6" gutterBottom>
            Start a Thread
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel id="discussion-scope-label">Scope</InputLabel>
            <Select
              labelId="discussion-scope-label"
              value={scopeValue}
              label="Scope"
              onChange={(event) => setScopeValue(event.target.value)}
              disabled={isPosting}
            >
              <MenuItem value="course">Course-wide discussion</MenuItem>
              {lessonOptions.map((lesson) => (
                <MenuItem key={lesson.lessonId} value={lesson.lessonId}>
                  {lesson.moduleTitle}: {lesson.lessonTitle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Thread Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isPosting}
          />

          <TextField
            fullWidth
            margin="normal"
            multiline
            minRows={4}
            label="What do you want to discuss?"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={isPosting}
          />

          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleCreateThread} disabled={isPosting}>
            {isPosting ? 'Posting...' : 'Post Thread'}
          </Button>
        </Paper>

        <Box>
          <Paper sx={{ p: 2.5, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h6">Threads</Typography>
                <Typography variant="body2" color="text.secondary">
                  Lesson filters also include course-wide threads so context does not get split apart.
                </Typography>
              </Box>

              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel id="discussion-filter-label">Filter</InputLabel>
                <Select
                  labelId="discussion-filter-label"
                  value={filterValue}
                  label="Filter"
                  onChange={(event) => setFilterValue(event.target.value)}
                >
                  <MenuItem value="all">All discussions</MenuItem>
                  <MenuItem value="course">Course-wide only</MenuItem>
                  {lessonOptions.map((lesson) => (
                    <MenuItem key={`filter-${lesson.lessonId}`} value={lesson.lessonId}>
                      {lesson.moduleTitle}: {lesson.lessonTitle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {visibleThreads.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No threads match this filter yet.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {visibleThreads.map((thread) => {
                const lessonMeta = getLessonMeta(thread.lessonId);
                return (
                  <Paper key={thread._id} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                      <Box>
                        <Typography variant="h6">{thread.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Started by {formatAuthorName(thread.author.firstName, thread.author.lastName)} on{' '}
                          {new Date(thread.createdAt).toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={lessonMeta ? `${lessonMeta.moduleTitle}: ${lessonMeta.lessonTitle}` : 'Course-wide'}
                          size="small"
                          color={lessonMeta ? 'primary' : 'default'}
                        />
                        <Chip label={`${thread.replyCount} repl${thread.replyCount === 1 ? 'y' : 'ies'}`} size="small" variant="outlined" />
                      </Box>
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {thread.content}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={2}>
                      {thread.replies.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No replies yet. Be the first to respond.
                        </Typography>
                      ) : (
                        thread.replies.map((reply) => (
                          <Box key={reply._id}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatAuthorName(reply.author.firstName, reply.author.lastName)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              {new Date(reply.createdAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">{reply.content}</Typography>
                          </Box>
                        ))
                      )}
                    </Stack>

                    <Box sx={{ mt: 2.5 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        label="Write a reply"
                        value={replyDrafts[thread._id] ?? ''}
                        onChange={(event) =>
                          setReplyDrafts((prev) => ({ ...prev, [thread._id]: event.target.value }))
                        }
                        disabled={replyingThreadId === thread._id}
                      />
                      <Button
                        variant="outlined"
                        sx={{ mt: 1.5 }}
                        onClick={() => handleReply(thread._id)}
                        disabled={replyingThreadId === thread._id}
                      >
                        {replyingThreadId === thread._id ? 'Replying...' : 'Reply'}
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CourseDiscussionPage;
