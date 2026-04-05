/**
 * Markets Page Loading Skeleton
 */

'use client';

import { Box, Skeleton, Stack } from '@mui/material';
import { designTokens } from '@/shared/styles/tokens';

export function MarketsPageLoadingSkeleton() {
  return (
    <Box>
      <Stack spacing={designTokens.spacing.sectionGap}>
        {/* Analytics Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ))}
        </Box>

        {/* Table */}
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
      </Stack>
    </Box>
  );
}
