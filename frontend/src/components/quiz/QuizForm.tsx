/**
 * QuizForm component for instructors to create/edit quizzes
 */

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Select,
  MenuItem,
  Checkbox,
  FormControl,
  InputLabel,
  Grid,
  ListItemText,
  FormControlLabel,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Quiz, QuizQuestion } from '../../types/quiz.types';
import { Module } from '../../types/course.types';
import { questionBankService } from '@/services/questionBank.service';
import { QuestionBankItem } from '@/types/questionBank.types';

interface QuizFormProps {
  initialData?: Quiz;
  modules?: Module[];
  defaultModuleId?: string;
  courseId?: string;
  onSubmit: (quizData: Partial<Quiz>) => void;
  onCancel: () => void;
}

const QuizForm: React.FC<QuizFormProps> = ({
  initialData,
  modules,
  defaultModuleId,
  courseId,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [moduleId, setModuleId] = useState(initialData?.moduleId || '');
  const [passingScore, setPassingScore] = useState(initialData?.passingScore || 70);
  const [duration, setDuration] = useState(initialData?.duration || 30);
  const [maxAttempts, setMaxAttempts] = useState(initialData?.maxAttempts || 1);
  const [shuffleQuestions, setShuffleQuestions] = useState(initialData?.shuffleQuestions ?? false);
  const [shuffleOptions, setShuffleOptions] = useState(initialData?.shuffleOptions ?? false);
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);
  const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>(
    initialData?.questions || [
      {
        type: 'multiple_choice',
        text: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        explanation: '',
      },
    ]
  );
  const [questionBankItems, setQuestionBankItems] = useState<QuestionBankItem[]>([]);
  const [selectedQuestionBankIds, setSelectedQuestionBankIds] = useState<string[]>([]);
  const [questionBankLoading, setQuestionBankLoading] = useState(false);
  const [questionBankError, setQuestionBankError] = useState<string | null>(null);

  useEffect(() => {
    // Default module selection for create flow once modules are loaded
    if (!initialData && modules && modules.length > 0 && !moduleId) {
      const preferred =
        defaultModuleId && modules.some((m) => m._id === defaultModuleId)
          ? defaultModuleId
          : modules[0]._id;
      setModuleId(preferred);
    }
  }, [initialData, modules, moduleId, defaultModuleId]);

  useEffect(() => {
    let active = true;

    const loadQuestionBank = async () => {
      if (!courseId) {
        setQuestionBankItems([]);
        setQuestionBankError(null);
        return;
      }

      setQuestionBankLoading(true);
      setQuestionBankError(null);

      try {
        const response = await questionBankService.getCourseQuestionBank(courseId, {
          includeInactive: true,
        });

        if (!active) return;
        setQuestionBankItems(response.data ?? []);
      } catch (error) {
        if (!active) return;
        setQuestionBankError((error as Error).message || 'Failed to load question bank');
      } finally {
        if (active) {
          setQuestionBankLoading(false);
        }
      }
    };

    void loadQuestionBank();

    return () => {
      active = false;
    };
  }, [courseId]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: 'multiple_choice',
        text: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    
    // Reset options when changing question type
    if (field === 'type') {
      if (value === 'multiple_choice') {
        updatedQuestions[index].options = ['', '', '', ''];
        updatedQuestions[index].correctAnswer = '';
      } else if (value === 'true_false') {
        updatedQuestions[index].options = ['true', 'false'];
        updatedQuestions[index].correctAnswer = 'true';
      } else if (value === 'multi_select') {
        updatedQuestions[index].options = ['', '', '', ''];
        updatedQuestions[index].correctAnswer = [];
      } else if (value === 'short_answer') {
        updatedQuestions[index].options = [];
        updatedQuestions[index].correctAnswer = '';
      }
    }
    
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options![optionIndex] = value;
      setQuestions(updatedQuestions);
    }
  };

  const handleAddOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) return;

    // Limit 2-6 options for choice-based questions
    if (updatedQuestions[questionIndex].options!.length >= 6) return;

    updatedQuestions[questionIndex].options!.push('');
    setQuestions(updatedQuestions);
  };

  const handleImportQuestionBankItems = () => {
    if (selectedQuestionBankIds.length === 0) {
      return;
    }

    const itemsToImport = selectedQuestionBankIds
      .map((itemId) => questionBankItems.find((item) => item.id === itemId))
      .filter((item): item is QuestionBankItem => Boolean(item))
      .filter((item) => item.isActive);

    if (itemsToImport.length === 0) {
      return;
    }

    const importedQuestions: Partial<QuizQuestion>[] = itemsToImport.map((item) => ({
      type: item.type,
      text: item.text,
      options: item.type === 'short_answer' ? [] : [...item.options],
      correctAnswer: Array.isArray(item.correctAnswer)
        ? [...item.correctAnswer]
        : item.correctAnswer,
      points: item.points,
      explanation: item.explanation ?? '',
      questionBankItemId: item.id,
    }));

    setQuestions((prev) => [...prev, ...importedQuestions]);
    setSelectedQuestionBankIds([]);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options && updatedQuestions[questionIndex].options!.length > 2) {
      updatedQuestions[questionIndex].options!.splice(optionIndex, 1);
      setQuestions(updatedQuestions);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedQuestions = questions.map((q) => {
      const type = q.type as QuizQuestion['type'];
      const options =
        type === 'short_answer'
          ? []
          : (q.options || []).map((o) => String(o)).map((o) => o.trim()).filter(Boolean);

      const correctAnswer =
        type === 'multi_select'
          ? Array.isArray(q.correctAnswer)
            ? q.correctAnswer.filter((a) => options.includes(String(a)))
            : []
          : typeof q.correctAnswer === 'string'
            ? q.correctAnswer
            : '';

      const base = {
        type,
        text: (q.text || '').trim(),
        options,
        correctAnswer,
        points: Number(q.points) || 1,
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
        questionBankItemId: (q as any).questionBankItemId || undefined,
      } as any;

      if ((q as any)._id) {
        base._id = (q as any)._id;
      }

      return base;
    });
    
    const quizData: Partial<Quiz> = {
      moduleId,
      title,
      description,
      duration,
      passingScore,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      isPublished,
      questions: normalizedQuestions,
    };
    
    onSubmit(quizData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quiz Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Add your questions below, then set the correct answer for each question type.
        </Typography>
        
        <TextField
          fullWidth
          label="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          margin="normal"
        />
        
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          margin="normal"
        />

        {modules && modules.length > 0 && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Module</InputLabel>
            <Select
              value={moduleId}
              onChange={(e) => setModuleId(String(e.target.value))}
              label="Module"
              required
              disabled={Boolean(initialData)}
            >
              {modules.map((m) => (
                <MenuItem key={m._id} value={m._id}>
                  {m.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid>
            <TextField
              fullWidth
              type="number"
              label="Passing Score (%)"
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              required
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
          
          <Grid>
            <TextField
              fullWidth
              type="number"
              label="Duration (minutes)"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
              inputProps={{ min: 1, max: 300 }}
            />
          </Grid>
          
          <Grid>
            <TextField
              fullWidth
              type="number"
              label="Max Attempts"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              required
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
              />
            }
            label="Shuffle question order for students"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
              />
            }
            label="Shuffle answer choices for students"
          />
        </Box>

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
          }
          label="Publish quiz now (students can see and take it)"
        />
      </Paper>

      {courseId && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Question Bank
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Import reusable questions into this quiz. Imported questions stay editable here.
          </Typography>

          {questionBankError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {questionBankError}
            </Alert>
          )}

          {questionBankLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : questionBankItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No question bank items found for this course yet.
            </Typography>
          ) : (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel id="question-bank-import-label">Import From Question Bank</InputLabel>
                <Select
                  labelId="question-bank-import-label"
                  multiple
                  value={selectedQuestionBankIds}
                  label="Import From Question Bank"
                  onChange={(e) =>
                    setSelectedQuestionBankIds(
                      Array.isArray(e.target.value)
                        ? e.target.value
                        : String(e.target.value).split(',')
                    )
                  }
                  renderValue={(selected) => `${(selected as string[]).length} item(s) selected`}
                >
                  {questionBankItems.map((item) => (
                    <MenuItem key={item.id} value={item.id} disabled={!item.isActive}>
                      <Checkbox checked={selectedQuestionBankIds.includes(item.id)} />
                      <ListItemText
                        primary={item.text}
                        secondary={`${item.type.replace('_', ' ')}${item.isActive ? '' : ' • inactive'}`}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {questionBankItems
                  .filter((item) => item.isActive)
                  .slice(0, 6)
                  .map((item) => (
                    <Chip
                      key={`question-bank-chip-${item.id}`}
                      label={item.text.length > 40 ? `${item.text.slice(0, 40)}...` : item.text}
                      size="small"
                      variant="outlined"
                    />
                  ))}
              </Box>

              <Button
                variant="outlined"
                onClick={handleImportQuestionBankItems}
                disabled={selectedQuestionBankIds.length === 0}
              >
                Import Selected Questions
              </Button>
            </>
          )}
        </Paper>
      )}

      <Typography variant="h6" gutterBottom>
        Questions
      </Typography>

      {questions.map((question, qIndex) => (
        <Paper key={qIndex} sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Question {qIndex + 1}</Typography>
            <IconButton
              color="error"
              onClick={() => handleRemoveQuestion(qIndex)}
              disabled={questions.length === 1}
            >
              <DeleteIcon />
            </IconButton>
          </Box>

          {(question as any).questionBankItemId && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip label="Imported from question bank" size="small" color="primary" variant="outlined" />
              <Button
                size="small"
                onClick={() => handleQuestionChange(qIndex, 'questionBankItemId', undefined)}
              >
                Unlink
              </Button>
            </Box>
          )}

          <TextField
            fullWidth
            label="Question Text"
            value={question.text}
            onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
            required
            margin="normal"
          />

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={question.type}
                  onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                  label="Question Type"
                >
                  <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                  <MenuItem value="true_false">True/False</MenuItem>
                  <MenuItem value="multi_select">Multi Select</MenuItem>
                  <MenuItem value="short_answer">Short Answer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid>
              <TextField
                fullWidth
                type="number"
                label="Points"
                value={question.points}
                onChange={(e) => handleQuestionChange(qIndex, 'points', Number(e.target.value))}
                required
                inputProps={{ min: 0.1 }}
              />
            </Grid>
          </Grid>

          {(question.type === 'multiple_choice' || question.type === 'multi_select') && question.options && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Options
              </Typography>
              {question.options.map((option, oIndex) => (
                <Box key={oIndex} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label={`Option ${oIndex + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    required
                  />
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveOption(qIndex, oIndex)}
                    disabled={question.options!.length <= 2}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleAddOption(qIndex)}
                size="small"
                disabled={question.options.length >= 6}
              >
                Add Option
              </Button>
            </Box>
          )}

          {question.type === 'true_false' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Correct Answer</InputLabel>
              <Select
                value={question.correctAnswer}
                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                label="Correct Answer"
                required
              >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </Select>
            </FormControl>
          )}

          {question.type === 'multiple_choice' && question.options && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Correct Answer</InputLabel>
              <Select
                value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                label="Correct Answer"
                required
              >
                {question.options.map((option, index) => (
                  <MenuItem key={index} value={option}>
                    {option || `Option ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {question.type === 'multi_select' && question.options && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Correct Answer(s)</InputLabel>
              <Select
                multiple
                value={Array.isArray(question.correctAnswer) ? question.correctAnswer : []}
                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                label="Correct Answer(s)"
                renderValue={(selected) => (selected as string[]).join(', ')}
              >
                {question.options.map((option, index) => (
                  <MenuItem key={index} value={option} disabled={!option}>
                    <Checkbox checked={Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(option) : false} />
                    <ListItemText primary={option || `Option ${index + 1}`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {question.type === 'short_answer' && (
            <TextField
              fullWidth
              label="Correct Answer"
              value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
              onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
              required
              margin="normal"
              helperText="Enter the expected answer (case-insensitive)"
            />
          )}

          <TextField
            fullWidth
            label="Explanation (optional)"
            value={question.explanation || ''}
            onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
            multiline
            rows={2}
            margin="normal"
          />
        </Paper>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddQuestion}
        fullWidth
        sx={{ mb: 3 }}
      >
        Add Question
      </Button>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          {initialData ? 'Update Quiz' : 'Create Quiz'}
        </Button>
      </Box>
    </Box>
  );
};

export default QuizForm;
