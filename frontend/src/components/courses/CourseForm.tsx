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
  Divider,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { CreateCourseData, UpdateCourseData, Course } from '@/types/course.types';

const toDateTimeLocalValue = (value?: string): string => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetInMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetInMs).toISOString().slice(0, 16);
};

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
    saleEnabled: false,
    saleType: 'percentage',
    saleValue: 0,
    saleStartsAt: '',
    saleEndsAt: '',
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
        saleEnabled: course.saleEnabled,
        saleType: course.saleType ?? 'percentage',
        saleValue: course.saleValue ?? 0,
        saleStartsAt: toDateTimeLocalValue(course.saleStartsAt),
        saleEndsAt: toDateTimeLocalValue(course.saleEndsAt),
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

    if (!formData.isFree && formData.saleEnabled) {
      if (!formData.saleType) {
        newErrors.saleType = 'Discount type is required';
      }

      if (formData.saleValue === undefined || Number.isNaN(Number(formData.saleValue))) {
        newErrors.saleValue = 'Discount value is required';
      } else if (Number(formData.saleValue) <= 0) {
        newErrors.saleValue = 'Discount value must be greater than 0';
      } else if (formData.saleType === 'percentage' && Number(formData.saleValue) > 100) {
        newErrors.saleValue = 'Percentage discount cannot exceed 100';
      }

      if (formData.saleStartsAt && formData.saleEndsAt) {
        const startDate = new Date(formData.saleStartsAt);
        const endDate = new Date(formData.saleEndsAt);
        if (startDate > endDate) {
          newErrors.saleEndsAt = 'End date must be after the start date';
        }
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
      if (name === 'saleValue') next.saleValue = Number(value);
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
      saleValue: formData.saleEnabled && !formData.isFree ? Number(formData.saleValue ?? 0) : undefined,
      saleStartsAt: formData.saleEnabled && formData.saleStartsAt ? new Date(formData.saleStartsAt).toISOString() : undefined,
      saleEndsAt: formData.saleEnabled && formData.saleEndsAt ? new Date(formData.saleEndsAt).toISOString() : undefined,
    };

    await onSubmit(payload);
  };

  const effectivePrice =
    formData.isFree
      ? 0
      : formData.saleEnabled && formData.saleValue
        ? Math.max(
            0,
            formData.saleType === 'percentage'
              ? formData.price - (formData.price * Number(formData.saleValue)) / 100
              : formData.price - Number(formData.saleValue)
          )
        : formData.price;

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
          <MenuItem value="EUR">EUR</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Pricing Controls
      </Typography>

      <FormControl fullWidth margin="normal">
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(formData.saleEnabled) && !formData.isFree}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData((prev) => ({
                  ...prev,
                  saleEnabled: checked,
                  saleType: prev.saleType ?? 'percentage',
                  saleValue: checked ? prev.saleValue : 0,
                  saleStartsAt: checked ? prev.saleStartsAt : '',
                  saleEndsAt: checked ? prev.saleEndsAt : '',
                }));
              }}
              disabled={isLoading || formData.isFree}
            />
          }
          label="Enable sale pricing"
        />
      </FormControl>

      {formData.saleEnabled && !formData.isFree && (
        <>
          <FormControl fullWidth margin="normal" error={!!errors.saleType}>
            <InputLabel id="sale-type-label">Discount Type</InputLabel>
            <Select
              labelId="sale-type-label"
              id="saleType"
              name="saleType"
              value={formData.saleType ?? 'percentage'}
              label="Discount Type"
              onChange={handleChange}
              disabled={isLoading}
            >
              <MenuItem value="percentage">Percentage</MenuItem>
              <MenuItem value="fixed">Fixed Amount</MenuItem>
            </Select>
            {errors.saleType && <FormHelperText>{errors.saleType}</FormHelperText>}
          </FormControl>

          <TextField
            margin="normal"
            fullWidth
            id="saleValue"
            label={formData.saleType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
            name="saleValue"
            type="number"
            value={formData.saleValue ?? 0}
            onChange={handleChange}
            error={!!errors.saleValue}
            helperText={errors.saleValue}
            disabled={isLoading}
          />

          <TextField
            margin="normal"
            fullWidth
            id="saleStartsAt"
            label="Sale Starts At"
            name="saleStartsAt"
            type="datetime-local"
            value={formData.saleStartsAt ?? ''}
            onChange={handleChange}
            error={!!errors.saleStartsAt}
            helperText={errors.saleStartsAt || 'Optional'}
            disabled={isLoading}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            margin="normal"
            fullWidth
            id="saleEndsAt"
            label="Sale Ends At"
            name="saleEndsAt"
            type="datetime-local"
            value={formData.saleEndsAt ?? ''}
            onChange={handleChange}
            error={!!errors.saleEndsAt}
            helperText={errors.saleEndsAt || 'Optional'}
            disabled={isLoading}
            InputLabelProps={{ shrink: true }}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            Sale preview: {formData.currency} {effectivePrice.toFixed(2)}
          </Alert>
        </>
      )}

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
