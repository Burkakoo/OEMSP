import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { courseService } from '@/services/course.service';
import { questionBankService } from '@/services/questionBank.service';
import { Course } from '@/types/course.types';
import {
  QuestionBankItem,
  QuestionBankItemFormData,
} from '@/types/questionBank.types';
import { QuestionType } from '@/types/quiz.types';

interface FormState {
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer: string | string[];
  points: number;
  explanation: string;
  tags: string;
  isActive: boolean;
}

const createEmptyForm = (): FormState => ({
  type: 'multiple_choice',
  text: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  points: 1,
  explanation: '',
  tags: '',
  isActive: true,
});

const getOptionsForType = (type: QuestionType): string[] => {
  if (type === 'short_answer') return [];
  if (type === 'true_false') return ['true', 'false'];
  return ['', '', '', ''];
};

const toFormState = (item: QuestionBankItem): FormState => ({
  type: item.type,
  text: item.text,
  options: item.type === 'true_false' ? ['true', 'false'] : [...item.options],
  correctAnswer: Array.isArray(item.correctAnswer)
    ? [...item.correctAnswer]
    : item.correctAnswer,
  points: item.points,
  explanation: item.explanation ?? '',
  tags: item.tags.join(', '),
  isActive: item.isActive,
});

const CourseQuestionBankPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [items, setItems] = React.useState<QuestionBankItem[]>([]);
  const [form, setForm] = React.useState<FormState>(createEmptyForm());
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const loadPage = React.useCallback(async () => {
    if (!courseId) {
      setError('Course ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [courseResponse, itemsResponse] = await Promise.all([
        courseService.getCourse(courseId),
        questionBankService.getCourseQuestionBank(courseId, { includeInactive: true }),
      ]);

      setCourse(courseResponse.data);
      setItems(itemsResponse.data ?? []);
    } catch (loadError) {
      setError((loadError as Error).message || 'Failed to load question bank');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const resetForm = () => {
    setEditingItemId(null);
    setForm(createEmptyForm());
    setFormErrors({});
  };

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleTypeChange = (value: QuestionType) => {
    updateForm({
      type: value,
      options: getOptionsForType(value),
      correctAnswer: value === 'multi_select' ? [] : value === 'true_false' ? 'true' : '',
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const nextOptions = [...form.options];
    nextOptions[index] = value;
    updateForm({ options: nextOptions });
  };

  const handleAddOption = () => {
    if (form.type === 'true_false' || form.type === 'short_answer' || form.options.length >= 6) {
      return;
    }

    updateForm({ options: [...form.options, ''] });
  };

  const handleRemoveOption = (index: number) => {
    if (form.options.length <= 2 || form.type === 'true_false') {
      return;
    }

    const nextOptions = form.options.filter((_, optionIndex) => optionIndex !== index);
    const nextCorrectAnswer = Array.isArray(form.correctAnswer)
      ? form.correctAnswer.filter((answer) => nextOptions.includes(answer))
      : nextOptions.includes(String(form.correctAnswer))
        ? form.correctAnswer
        : '';

    updateForm({ options: nextOptions, correctAnswer: nextCorrectAnswer });
  };

  const buildPayload = (): QuestionBankItemFormData | null => {
    const nextErrors: Record<string, string> = {};
    const text = form.text.trim();
    const options =
      form.type === 'short_answer'
        ? []
        : form.type === 'true_false'
          ? ['true', 'false']
          : form.options.map((option) => option.trim()).filter(Boolean);

    const correctAnswer =
      form.type === 'multi_select'
        ? Array.isArray(form.correctAnswer)
          ? form.correctAnswer.filter((answer) => options.includes(answer))
          : []
        : form.type === 'true_false'
          ? form.correctAnswer === 'false'
            ? 'false'
            : 'true'
          : String(form.correctAnswer ?? '').trim();

    if (text.length < 5) nextErrors.text = 'Question text must be at least 5 characters';
    if (Number(form.points) <= 0) nextErrors.points = 'Points must be greater than 0';
    if (
      (form.type === 'multiple_choice' || form.type === 'multi_select') &&
      (options.length < 2 || options.length > 6)
    ) {
      nextErrors.options = 'Choice questions need 2 to 6 options';
    }
    if (
      form.type === 'multiple_choice' &&
      (!correctAnswer || !options.includes(String(correctAnswer)))
    ) {
      nextErrors.correctAnswer = 'Pick one of the options as the correct answer';
    }
    if (form.type === 'multi_select' && (!Array.isArray(correctAnswer) || correctAnswer.length === 0)) {
      nextErrors.correctAnswer = 'Select at least one correct answer';
    }
    if (form.type === 'short_answer' && String(correctAnswer).trim().length === 0) {
      nextErrors.correctAnswer = 'Short-answer questions need an expected answer';
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return null;
    }

    return {
      type: form.type,
      text,
      options,
      correctAnswer,
      points: Number(form.points),
      explanation: form.explanation.trim() || undefined,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      isActive: Boolean(form.isActive),
    };
  };

  const handleSave = async () => {
    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    setIsSaving(true);
    setError(null);

    try {
      if (editingItemId) {
        await questionBankService.updateQuestionBankItem(editingItemId, payload);
      } else {
        await questionBankService.createQuestionBankItem(courseId, payload);
      }
      resetForm();
      await loadPage();
    } catch (saveError) {
      setError((saveError as Error).message || 'Failed to save question bank item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Delete this question bank item?')) return;

    setError(null);
    try {
      await questionBankService.deleteQuestionBankItem(itemId);
      if (editingItemId === itemId) {
        resetForm();
      }
      await loadPage();
    } catch (deleteError) {
      setError((deleteError as Error).message || 'Failed to delete question bank item');
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
    <Box sx={{ maxWidth: 1120, mx: 'auto', px: 3, py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(courseId ? `/instructor/courses/${courseId}/edit` : '/instructor/courses')}
        sx={{ mb: 2 }}
      >
        Back to Course
      </Button>

      <Typography variant="h4" gutterBottom>
        Question Bank
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {course
          ? `Build reusable questions for ${course.title} and import them directly into quizzes.`
          : 'Build reusable questions and import them directly into quizzes.'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' } }}>
        <Paper sx={{ p: 3, alignSelf: 'start' }}>
          <Typography variant="h6" gutterBottom>
            {editingItemId ? 'Edit Item' : 'New Item'}
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel id="question-bank-type-label">Question Type</InputLabel>
            <Select
              labelId="question-bank-type-label"
              value={form.type}
              label="Question Type"
              onChange={(event) => handleTypeChange(event.target.value as QuestionType)}
              disabled={isSaving}
            >
              <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
              <MenuItem value="true_false">True / False</MenuItem>
              <MenuItem value="multi_select">Multi Select</MenuItem>
              <MenuItem value="short_answer">Short Answer</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Question Text"
            value={form.text}
            onChange={(event) => updateForm({ text: event.target.value })}
            error={!!formErrors.text}
            helperText={formErrors.text}
            disabled={isSaving}
          />

          {(form.type === 'multiple_choice' || form.type === 'multi_select') && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Options</Typography>
              <Stack spacing={1}>
                {form.options.map((option, index) => (
                  <Box key={`option-${index}`} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(event) => handleOptionChange(index, event.target.value)}
                      disabled={isSaving}
                    />
                    <Button
                      color="error"
                      onClick={() => handleRemoveOption(index)}
                      disabled={isSaving || form.options.length <= 2}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              </Stack>
              <Button sx={{ mt: 1 }} onClick={handleAddOption} disabled={isSaving || form.options.length >= 6}>
                Add Option
              </Button>
              {formErrors.options && (
                <Typography variant="caption" color="error" display="block">
                  {formErrors.options}
                </Typography>
              )}
            </Box>
          )}

          {form.type === 'multiple_choice' && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="question-bank-correct-answer-label">Correct Answer</InputLabel>
              <Select
                labelId="question-bank-correct-answer-label"
                value={typeof form.correctAnswer === 'string' ? form.correctAnswer : ''}
                label="Correct Answer"
                onChange={(event) => updateForm({ correctAnswer: event.target.value })}
                disabled={isSaving}
              >
                {form.options.map((option) => option.trim()).filter(Boolean).map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {form.type === 'true_false' && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="question-bank-true-false-label">Correct Answer</InputLabel>
              <Select
                labelId="question-bank-true-false-label"
                value={typeof form.correctAnswer === 'string' ? form.correctAnswer : 'true'}
                label="Correct Answer"
                onChange={(event) => updateForm({ correctAnswer: event.target.value })}
                disabled={isSaving}
              >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </Select>
            </FormControl>
          )}

          {form.type === 'multi_select' && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="question-bank-multi-select-label">Correct Answers</InputLabel>
              <Select
                labelId="question-bank-multi-select-label"
                multiple
                value={Array.isArray(form.correctAnswer) ? form.correctAnswer : []}
                label="Correct Answers"
                renderValue={(selected) => (selected as string[]).join(', ')}
                onChange={(event) => updateForm({ correctAnswer: event.target.value as string[] })}
                disabled={isSaving}
              >
                {form.options.map((option) => option.trim()).filter(Boolean).map((option) => (
                  <MenuItem key={option} value={option}>
                    <Checkbox
                      checked={Array.isArray(form.correctAnswer) && form.correctAnswer.includes(option)}
                    />
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {form.type === 'short_answer' && (
            <TextField
              fullWidth
              margin="normal"
              label="Expected Answer"
              value={typeof form.correctAnswer === 'string' ? form.correctAnswer : ''}
              onChange={(event) => updateForm({ correctAnswer: event.target.value })}
              disabled={isSaving}
            />
          )}

          {formErrors.correctAnswer && (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
              {formErrors.correctAnswer}
            </Typography>
          )}

          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Points"
            value={form.points}
            onChange={(event) => updateForm({ points: Number(event.target.value) })}
            error={!!formErrors.points}
            helperText={formErrors.points}
            disabled={isSaving}
          />

          <TextField
            fullWidth
            margin="normal"
            multiline
            minRows={2}
            label="Explanation (optional)"
            value={form.explanation}
            onChange={(event) => updateForm({ explanation: event.target.value })}
            disabled={isSaving}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Tags"
            value={form.tags}
            onChange={(event) => updateForm({ tags: event.target.value })}
            helperText="Separate tags with commas."
            disabled={isSaving}
          />

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={form.isActive}
                onChange={(event) => updateForm({ isActive: event.target.checked })}
                disabled={isSaving}
              />
            }
            label="Question bank item is active"
          />

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Button variant="contained" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingItemId ? 'Save Changes' : 'Create Item'}
            </Button>
            {editingItemId && (
              <Button variant="outlined" onClick={resetForm} disabled={isSaving}>
                Cancel Edit
              </Button>
            )}
          </Box>
        </Paper>

        <Stack spacing={2}>
          {items.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No reusable questions yet. Create one from the form to get started.
              </Typography>
            </Paper>
          ) : (
            items.map((item) => (
              <Paper key={item.id} sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                      <Chip label={item.type.replace('_', ' ')} size="small" />
                      <Chip label={`${item.points} pt${item.points === 1 ? '' : 's'}`} size="small" variant="outlined" />
                      <Chip
                        label={item.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={item.isActive ? 'success' : 'default'}
                      />
                      {item.tags.map((tag) => (
                        <Chip key={`${item.id}-${tag}`} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>

                    <Typography variant="h6" sx={{ mb: 1 }}>{item.text}</Typography>
                    {item.options.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Options: {item.options.join(', ')}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Correct answer: {Array.isArray(item.correctAnswer) ? item.correctAnswer.join(', ') : item.correctAnswer}
                    </Typography>
                    {item.explanation && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Explanation: {item.explanation}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ flexShrink: 0 }}>
                    <IconButton
                      onClick={() => {
                        setEditingItemId(item.id);
                        setForm(toFormState(item));
                        setFormErrors({});
                      }}
                      aria-label="edit question bank item"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(item.id)}
                      aria-label="delete question bank item"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default CourseQuestionBankPage;
