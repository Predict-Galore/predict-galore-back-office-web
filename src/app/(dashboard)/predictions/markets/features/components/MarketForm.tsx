/**
 * Market Form Component
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  useCreateMarket,
  useUpdateMarket,
  useAddSelection,
  useUpdateSelection,
  useDeleteSelection,
  Market,
} from '@/features/markets';
import { marketFormSchema, MarketFormValues } from '@/features/markets/validations/marketSchema';
import { useQueryClient } from '@tanstack/react-query';

interface MarketFormProps {
  market?: Market | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MarketForm: React.FC<MarketFormProps> = ({ market, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const isEditing = Boolean(market?.id);
  const createMarketMutation = useCreateMarket();
  const updateMarketMutation = useUpdateMarket();
  const addSelectionMutation = useAddSelection();
  const updateSelectionMutation = useUpdateSelection();
  const deleteSelectionMutation = useDeleteSelection();
  const isLoading =
    createMarketMutation.isPending ||
    updateMarketMutation.isPending ||
    addSelectionMutation.isPending ||
    updateSelectionMutation.isPending ||
    deleteSelectionMutation.isPending;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(marketFormSchema),
    defaultValues: {
      name: market?.name || '',
      displayName: market?.displayName || '',
      category: market?.category || '',
      description: market?.description || '',
      sortOrder: market?.sortOrder || 1000,
      isActive: market?.isActive ?? true,
      selections: market?.selections || [
        { selectionKey: '', selectionLabel: '', sortOrder: 1000, isActive: true },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'selections',
    keyName: 'fieldId',
  });

  const onSubmit = async (data: MarketFormValues) => {
    try {
      if (isEditing && market) {
        // Update existing market
        const updateData = {
          displayName: data.displayName,
          category: data.category,
          description: data.description,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        
        await updateMarketMutation.mutateAsync({ id: market.id, data: updateData });

        // Sync selections (add/update/delete) via dedicated endpoints
        const existingSelections = Array.isArray(market.selections) ? market.selections : [];
        const existingIds = new Set(
          existingSelections.map((s) => s.id).filter((id): id is number => typeof id === 'number')
        );
        const submittedIds = new Set<number>();

        const selectionOps: Promise<unknown>[] = [];

        for (const selection of data.selections) {
          if (selection.id && existingIds.has(selection.id)) {
            submittedIds.add(selection.id);
            selectionOps.push(
              updateSelectionMutation.mutateAsync({
                selectionId: selection.id,
                data: {
                  selectionLabel: selection.selectionLabel,
                  sortOrder: selection.sortOrder,
                  isActive: selection.isActive,
                },
              })
            );
          } else {
            selectionOps.push(
              addSelectionMutation.mutateAsync({
                marketId: market.id,
                data: {
                  selectionKey: selection.selectionKey,
                  selectionLabel: selection.selectionLabel,
                  sortOrder: selection.sortOrder,
                  isActive: selection.isActive,
                },
              })
            );
          }
        }

        for (const selectionId of existingIds) {
          if (!submittedIds.has(selectionId)) {
            selectionOps.push(deleteSelectionMutation.mutateAsync(selectionId));
          }
        }

        if (selectionOps.length > 0) {
          await Promise.all(selectionOps);
        }
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['markets'] });
        await queryClient.invalidateQueries({ queryKey: ['market', market.id] });
        await queryClient.invalidateQueries({ queryKey: ['markets-analytics'] });
        
        setSnackbar({
          open: true,
          message: 'Market updated successfully!',
          severity: 'success',
        });
      } else {
        // Create new market
        await createMarketMutation.mutateAsync(data);
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['markets'] });
        await queryClient.invalidateQueries({ queryKey: ['markets-analytics'] });
        
        setSnackbar({
          open: true,
          message: 'Market created successfully!',
          severity: 'success',
        });
      }

      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} market`,
        severity: 'error',
      });
    }
  };

  const handleAddSelection = useCallback(() => {
    append({ selectionKey: '', selectionLabel: '', sortOrder: 1000, isActive: true });
  }, [append]);

  const handleRemoveSelection = useCallback((index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  }, [fields.length, remove]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <Typography variant="h6">Market Information</Typography>

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Market Name (Key)"
              placeholder="e.g., match_result"
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={isLoading || isEditing}
              fullWidth
            />
          )}
        />

        <Controller
          name="displayName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Display Name"
              placeholder="e.g., Match Result"
              error={!!errors.displayName}
              helperText={errors.displayName?.message}
              disabled={isLoading}
              fullWidth
            />
          )}
        />

        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Category"
              placeholder="e.g., Football, Basketball"
              error={!!errors.category}
              helperText={errors.category?.message}
              disabled={isLoading}
              fullWidth
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              placeholder="Describe this market..."
              error={!!errors.description}
              helperText={errors.description?.message}
              disabled={isLoading}
              multiline
              rows={3}
              fullWidth
            />
          )}
        />

        <Controller
          name="sortOrder"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Sort Order"
              type="number"
              error={!!errors.sortOrder}
              helperText={errors.sortOrder?.message}
              disabled={isLoading}
              fullWidth
              onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
            />
          )}
        />

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} disabled={isLoading} />}
              label="Active"
            />
          )}
        />

        <Divider />

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Selections</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddSelection}
              disabled={isLoading}
              size="small"
            >
              Add Selection
            </Button>
          </Stack>

          {errors.selections && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.selections.message}
            </Alert>
          )}

          <Stack spacing={2}>
            {fields.map((field, index) => (
              <Box
                key={field.fieldId}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Selection {index + 1}</Typography>
                    {fields.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveSelection(index)}
                        disabled={isLoading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>

                  <Controller
                    name={`selections.${index}.selectionKey`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Selection Key"
                        placeholder="e.g., home_win"
                        error={!!errors.selections?.[index]?.selectionKey}
                        helperText={
                          errors.selections?.[index]?.selectionKey?.message ||
                          ((isEditing && typeof (fields[index] as { id?: number }).id === 'number')
                            ? 'Selection key cannot be edited'
                            : undefined)
                        }
                        disabled={
                          isLoading ||
                          (isEditing && typeof (fields[index] as { id?: number }).id === 'number')
                        }
                        size="small"
                        fullWidth
                      />
                    )}
                  />

                  <Controller
                    name={`selections.${index}.selectionLabel`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Selection Label"
                        placeholder="e.g., Home Win"
                        error={!!errors.selections?.[index]?.selectionLabel}
                        helperText={errors.selections?.[index]?.selectionLabel?.message}
                        disabled={isLoading}
                        size="small"
                        fullWidth
                      />
                    )}
                  />

                  <Stack direction="row" spacing={2}>
                    <Controller
                      name={`selections.${index}.sortOrder`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Sort Order"
                          type="number"
                          error={!!errors.selections?.[index]?.sortOrder}
                          helperText={errors.selections?.[index]?.sortOrder?.message}
                          disabled={isLoading}
                          size="small"
                          fullWidth
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        />
                      )}
                    />

                    <Controller
                      name={`selections.${index}.isActive`}
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} disabled={isLoading} />}
                          label="Active"
                        />
                      )}
                    />
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Update Market' : 'Create Market'}
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
