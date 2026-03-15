/**
 * QuizForm component for instructors to create/edit quizzes
 */

import React, { useState, useEffect } from 'react';
import {
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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Quiz, QuizQuestion } from '../../types/quiz.types';
import { Module } from '../../types/course.types';

interface QuizFormProps {
  initialData?: Quiz;
  modules?: Module[];
  onSubmit: (quizData: Partial<Quiz>) => void;
  onCancel: () => void;
}

const QuizForm: React.FC<QuizFormProps> = ({ initialData, modules, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [moduleId, setModuleId] = useState(initialData?.moduleId || '');
  const [passingScore, setPassingScore] = useState(initialData?.passingScore || 70);
  const [duration, setDuration] = useState(initialData?.duration || 30);
  const [maxAttempts, setMaxAttempts] = useState(initialData?.maxAttempts || 1);
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

  useEffect(() => {
    // Default module selection for create flow once modules are loaded
    if (!initialData && modules && modules.length > 0 && !moduleId) {
      setModuleId(modules[0]._id);
    }
  }, [initialData, modules, moduleId]);

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
      </Paper>

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
