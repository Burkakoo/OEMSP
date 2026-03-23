/**
 * Course form component for instructors
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { CreateCourseData, UpdateCourseData, Course } from '@/types/course.types';

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CreateCourseData | UpdateCourseData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateCourseData>({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    price: 0,
    isFree: false,
    currency: 'ETB',
    thumbnail: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        isFree: course.isFree || false,
        currency: course.currency,
        thumbnail: course.thumbnail ?? '',
      });
    }
  }, [course]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const title = formData.title.trim();
    if (!title) {
      newErrors.title = 'Title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    const description = formData.description.trim();
    if (!description) {
      newErrors.description = 'Description is required';
    } else if (description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (description.length > 5000) {
      newErrors.description = 'Description cannot exceed 5000 characters';
    }

    const category = formData.category.trim();
    if (!category) {
      newErrors.category = 'Category is required';
    }

    // Skip price validation for free courses
    if (!formData.isFree) {
      if (Number.isNaN(formData.price)) {
        newErrors.price = 'Price is required';
      } else if (formData.price < 0) {
        newErrors.price = 'Price cannot be negative';
      } else if (formData.price > 99999.99) {
        newErrors.price = 'Price cannot exceed 99999.99';
      }
    }

    const thumbnail = (formData.thumbnail ?? '').trim();
    if (thumbnail.length > 0 && !/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(thumbnail)) {
      newErrors.thumbnail = 'Thumbnail must be a valid image URL ending in .jpg/.jpeg/.png/.gif/.webp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  type FieldChangeEvent =
    | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    | SelectChangeEvent<string>;

  const handleChange = (e: FieldChangeEvent) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prev) => {
      const next: any = { ...prev, [name]: value };
      if (name === 'price') next.price = Number(value);
      return next;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: CreateCourseData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      thumbnail: (formData.thumbnail ?? '').trim() ? (formData.thumbnail ?? '').trim() : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" gutterBottom>
        {course ? 'Edit Course' : 'Create New Course'}
      </Typography>

      <TextField
        margin="normal"
        required
        fullWidth
        id="title"
        label="Course Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={!!errors.title}
        helperText={errors.title}
        disabled={isLoading}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="description"
        label="Description"
        name="description"
        multiline
        rows={4}
        value={formData.description}
        onChange={handleChange}
        error={!!errors.description}
        helperText={errors.description}
        disabled={isLoading}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="category"
        label="Category"
        name="category"
        value={formData.category}
        onChange={handleChange}
        error={!!errors.category}
        helperText={errors.category}
        disabled={isLoading}
      />

      <FormControl fullWidth margin="normal" error={!!errors.level}>
        <InputLabel id="level-label">Level</InputLabel>
        <Select
          labelId="level-label"
          id="level"
          name="level"
          value={formData.level}
          label="Level"
          onChange={handleChange}
          disabled={isLoading}
        >
          <MenuItem value="beginner">Beginner</MenuItem>
          <MenuItem value="intermediate">Intermediate</MenuItem>
          <MenuItem value="advanced">Advanced</MenuItem>
        </Select>
        {errors.level && <FormHelperText>{errors.level}</FormHelperText>}
      </FormControl>

      <TextField
        margin="normal"
        required={!formData.isFree}
        fullWidth
        id="price"
        label="Price"
        name="price"
        type="number"
        value={formData.price}
        onChange={handleChange}
        error={!!errors.price}
        helperText={errors.price}
        disabled={isLoading || formData.isFree}
      />

      <FormControl fullWidth margin="normal">
        <FormControlLabel
          control={
            <Switch
              checked={formData.isFree}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  isFree: e.target.checked,
                  price: e.target.checked ? 0 : prev.price
                }));
              }}
              disabled={isLoading}
            />
          }
          label="Free Course"
        />
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel id="currency-label">Currency</InputLabel>
        <Select
          labelId="currency-label"
          id="currency"
          name="currency"
          value={formData.currency}
          label="Currency"
          onChange={handleChange}
          disabled={isLoading}
        >
          <MenuItem value="ETB">ETB (Ethiopian Birr)</MenuItem>
          <MenuItem value="USD">USD</MenuItem>
        </Select>
      </FormControl>

      <TextField
        margin="normal"
        fullWidth
        id="thumbnail"
        label="Thumbnail URL"
        name="thumbnail"
        value={formData.thumbnail}
        onChange={handleChange}
        error={!!errors.thumbnail}
        helperText={errors.thumbnail}
        disabled={isLoading}
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? <CircularProgress size={24} /> : course ? 'Update' : 'Create'}
        </Button>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CourseForm;
