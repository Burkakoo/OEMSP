import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { couponService } from '@/services/coupon.service';
import { Coupon, CreateCouponData } from '@/types/coupon.types';
import { DiscountType } from '@/types/course.types';

interface CourseCouponsManagerProps {
  courseId: string;
  currency: string;
}

const toDateTimeLocalValue = (value?: string): string => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetInMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetInMs).toISOString().slice(0, 16);
};

const emptyFormState: CreateCouponData = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  minimumPurchaseAmount: undefined,
  maxUses: undefined,
  validFrom: '',
  validUntil: '',
  isActive: true,
};

const CourseCouponsManager: React.FC<CourseCouponsManagerProps> = ({ courseId, currency }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CreateCouponData>(emptyFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadCoupons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await couponService.getCourseCoupons(courseId);
      setCoupons(response.coupons ?? []);
    } catch (loadError) {
      setError((loadError as Error).message || 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, [courseId]);

  const resetDialog = () => {
    setEditingCoupon(null);
    setFormData(emptyFormState);
    setFormErrors({});
  };

  const openCreateDialog = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description ?? '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumPurchaseAmount: coupon.minimumPurchaseAmount,
      maxUses: coupon.maxUses,
      validFrom: toDateTimeLocalValue(coupon.validFrom),
      validUntil: toDateTimeLocalValue(coupon.validUntil),
      isActive: coupon.isActive,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!formData.code?.trim()) {
      nextErrors.code = 'Coupon code is required';
    }

    if (formData.discountValue === undefined || Number(formData.discountValue) <= 0) {
      nextErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100) {
      nextErrors.discountValue = 'Percentage discount cannot exceed 100';
    }

    if (
      formData.minimumPurchaseAmount !== undefined &&
      Number(formData.minimumPurchaseAmount) < 0
    ) {
      nextErrors.minimumPurchaseAmount = 'Minimum purchase amount cannot be negative';
    }

    if (formData.maxUses !== undefined && Number(formData.maxUses) < 1) {
      nextErrors.maxUses = 'Maximum uses must be at least 1';
    }

    if (formData.validFrom && formData.validUntil) {
      const validFrom = new Date(formData.validFrom);
      const validUntil = new Date(formData.validUntil);
      if (validFrom > validUntil) {
        nextErrors.validUntil = 'Valid until must be after valid from';
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: CreateCouponData = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description?.trim() || undefined,
        discountType: formData.discountType as DiscountType,
        discountValue: Number(formData.discountValue),
        minimumPurchaseAmount:
          formData.minimumPurchaseAmount !== undefined && formData.minimumPurchaseAmount !== null
            ? Number(formData.minimumPurchaseAmount)
            : undefined,
        maxUses:
          formData.maxUses !== undefined && formData.maxUses !== null
            ? Number(formData.maxUses)
            : undefined,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : undefined,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
        isActive: Boolean(formData.isActive),
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, payload);
      } else {
        await couponService.createCoupon(courseId, payload);
      }

      setDialogOpen(false);
      resetDialog();
      await loadCoupons();
    } catch (saveError) {
      setError((saveError as Error).message || 'Failed to save coupon');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!window.confirm('Delete this coupon?')) {
      return;
    }

    setError(null);
    try {
      await couponService.deleteCoupon(couponId);
      await loadCoupons();
    } catch (deleteError) {
      setError((deleteError as Error).message || 'Failed to delete coupon');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
        <Box>
          <Typography variant="h6">Coupons</Typography>
          <Typography variant="body2" color="text.secondary">
            Create course-specific coupon codes and control how long they stay active.
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreateDialog}>
          Add Coupon
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : coupons.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No coupons created for this course yet.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {coupons.map((coupon) => (
            <Paper key={coupon.id} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={coupon.code} color="primary" />
                    <Chip
                      label={
                        coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% off`
                          : `${currency} ${coupon.discountValue.toFixed(2)} off`
                      }
                      variant="outlined"
                    />
                    <Chip
                      label={coupon.isActive ? 'Active' : 'Inactive'}
                      color={coupon.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    {coupon.maxUses !== undefined && (
                      <Chip
                        label={`${coupon.usedCount}/${coupon.maxUses} used`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {coupon.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {coupon.description}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary" display="block">
                    Minimum purchase: {coupon.minimumPurchaseAmount !== undefined ? `${currency} ${coupon.minimumPurchaseAmount.toFixed(2)}` : 'None'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Valid window: {coupon.validFrom ? new Date(coupon.validFrom).toLocaleString() : 'Any time'} to {coupon.validUntil ? new Date(coupon.validUntil).toLocaleString() : 'No expiry'}
                  </Typography>
                </Box>

                <Box>
                  <IconButton onClick={() => openEditDialog(coupon)} aria-label="edit coupon">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(coupon.id)} aria-label="delete coupon" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => (isSaving ? null : setDialogOpen(false))} fullWidth maxWidth="sm">
        <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            label="Coupon Code"
            value={formData.code ?? ''}
            onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
            error={!!formErrors.code}
            helperText={formErrors.code}
            disabled={isSaving}
          />

          <TextField
            margin="normal"
            fullWidth
            label="Description"
            value={formData.description ?? ''}
            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
            disabled={isSaving}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="coupon-discount-type-label">Discount Type</InputLabel>
            <Select
              labelId="coupon-discount-type-label"
              value={formData.discountType ?? 'percentage'}
              label="Discount Type"
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  discountType: event.target.value as DiscountType,
                }))
              }
              disabled={isSaving}
            >
              <MenuItem value="percentage">Percentage</MenuItem>
              <MenuItem value="fixed">Fixed Amount</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            fullWidth
            type="number"
            label={formData.discountType === 'percentage' ? 'Discount Percentage' : `Discount Amount (${currency})`}
            value={formData.discountValue ?? 0}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, discountValue: Number(event.target.value) }))
            }
            error={!!formErrors.discountValue}
            helperText={formErrors.discountValue}
            disabled={isSaving}
          />

          <TextField
            margin="normal"
            fullWidth
            type="number"
            label={`Minimum Purchase Amount (${currency})`}
            value={formData.minimumPurchaseAmount ?? ''}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                minimumPurchaseAmount:
                  event.target.value === '' ? undefined : Number(event.target.value),
              }))
            }
            error={!!formErrors.minimumPurchaseAmount}
            helperText={formErrors.minimumPurchaseAmount || 'Optional'}
            disabled={isSaving}
          />

          <TextField
            margin="normal"
            fullWidth
            type="number"
            label="Maximum Uses"
            value={formData.maxUses ?? ''}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                maxUses: event.target.value === '' ? undefined : Number(event.target.value),
              }))
            }
            error={!!formErrors.maxUses}
            helperText={formErrors.maxUses || 'Optional'}
            disabled={isSaving}
          />

          <TextField
            margin="normal"
            fullWidth
            type="datetime-local"
            label="Valid From"
            value={formData.validFrom ?? ''}
            onChange={(event) => setFormData((prev) => ({ ...prev, validFrom: event.target.value }))}
            disabled={isSaving}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            margin="normal"
            fullWidth
            type="datetime-local"
            label="Valid Until"
            value={formData.validUntil ?? ''}
            onChange={(event) => setFormData((prev) => ({ ...prev, validUntil: event.target.value }))}
            error={!!formErrors.validUntil}
            helperText={formErrors.validUntil || 'Optional'}
            disabled={isSaving}
            InputLabelProps={{ shrink: true }}
          />

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={Boolean(formData.isActive)}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, isActive: event.target.checked }))
                }
                disabled={isSaving}
              />
            }
            label="Coupon is active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseCouponsManager;
