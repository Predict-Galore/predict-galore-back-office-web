/**
 * Prev/Next Pagination
 * Icon-button based to avoid wrapping on small screens.
 */

'use client';

import { memo, useCallback } from 'react';
import { IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface PrevNextPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  size?: 'small' | 'medium' | 'large';
}

export const PrevNextPagination = memo(function PrevNextPagination({
  page,
  totalPages,
  onPageChange,
  size = 'small',
}: PrevNextPaginationProps) {
  const handlePrev = useCallback(() => {
    onPageChange(Math.max(1, page - 1));
  }, [onPageChange, page]);

  const handleNext = useCallback(() => {
    onPageChange(Math.min(totalPages, page + 1));
  }, [onPageChange, page, totalPages]);

  if (!totalPages || totalPages <= 1) return null;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{ mt: 3 }}
    >
      <IconButton size={size} onClick={handlePrev} disabled={page <= 1}>
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, textAlign: 'center' }}>
        Page {page} of {totalPages}
      </Typography>
      <IconButton size={size} onClick={handleNext} disabled={page >= totalPages}>
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  );
});
