/**
 * Quiz question component
 */

import React from 'react';
import {
  Typography,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Paper,
} from '@mui/material';
import { QuizQuestion as QuizQuestionType } from '../../types/quiz.types';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  answer: string | string[];
  onAnswerChange: (questionId: string, answer: string | string[]) => void;
  disabled?: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  answer,
  onAnswerChange,
  disabled = false,
}) => {
  const normalizedAnswer = Array.isArray(answer) ? answer : String(answer);
  const normalizedMultiAnswer = Array.isArray(answer) ? answer : [];

  const handleToggleMultiSelect = (option: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...normalizedMultiAnswer, option]))
      : normalizedMultiAnswer.filter((v) => v !== option);
    onAnswerChange(question._id, next);
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Question {questionNumber}
      </Typography>
      <Typography variant="body1" paragraph>
        {question.text}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Points: {question.points}
      </Typography>

      {question.type === 'multiple_choice' && question.options.length > 0 && (
        <FormControl component="fieldset" fullWidth disabled={disabled}>
          <RadioGroup
            value={normalizedAnswer}
            onChange={(e) => onAnswerChange(question._id, e.target.value)}
          >
            {question.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        </FormControl>
      )}

      {question.type === 'true_false' && (
        <FormControl component="fieldset" fullWidth disabled={disabled}>
          <RadioGroup
            value={normalizedAnswer}
            onChange={(e) => onAnswerChange(question._id, e.target.value)}
          >
            <FormControlLabel value="true" control={<Radio />} label="True" />
            <FormControlLabel value="false" control={<Radio />} label="False" />
          </RadioGroup>
        </FormControl>
      )}

      {question.type === 'multi_select' && question.options.length > 0 && (
        <FormControl component="fieldset" fullWidth disabled={disabled}>
          <FormGroup>
            {question.options.map((option, index) => (
              <FormControlLabel
                key={index}
                label={option}
                control={
                  <Checkbox
                    checked={normalizedMultiAnswer.includes(option)}
                    onChange={(e) => handleToggleMultiSelect(option, e.target.checked)}
                  />
                }
              />
            ))}
          </FormGroup>
        </FormControl>
      )}

      {question.type === 'short_answer' && (
        <TextField
          fullWidth
          multiline
          rows={3}
          value={normalizedAnswer}
          onChange={(e) => onAnswerChange(question._id, e.target.value)}
          placeholder="Type your answer here..."
          disabled={disabled}
        />
      )}
    </Paper>
  );
};

export default QuizQuestion;
