/**
 * Prev/Next Pagination
 * Reusable pagination control that avoids page-number overflow on mobile.
 */

'use client';

import { memo, useCallback } from 'react';
import { Button, Stack, Typography } from '@mui/material';

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
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="center"
      sx={{ mt: 3, flexWrap: 'wrap' }}
    >
      <Button
        size={size}
        variant="outlined"
        onClick={handlePrev}
        disabled={page <= 1}
      >
        Previous
      </Button>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: 'center', minWidth: { sm: 110 }, flexGrow: { sm: 1 } }}
      >
        Page {page} of {totalPages}
      </Typography>
      <Button
        size={size}
        variant="outlined"
        onClick={handleNext}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </Stack>
  );
});
