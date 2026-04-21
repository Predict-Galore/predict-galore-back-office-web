/**
 * Dashboard Page (Client)
 */

'use client';

import { PageHeader, TimeRange } from '@/shared/components/PageHeader';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import dynamic from 'next/dynamic';
import { DashboardPageLoadingSkeleton } from './features/components/DashboardPageLoadingSkeleton';
import { useAuth } from '@/features/auth';
import { useState, useCallback, memo } from 'react';
import { useDashboardSummary } from '@/features/dashboard';
import { useQueryClient } from '@tanstack/react-query';

const DashboardAnalytics = dynamic(() => import('./features/components/DashboardAnalytics'), {
  loading: () => <DashboardPageLoadingSkeleton />,
  ssr: false,
});
const UserEngagementChart = dynamic(() => import('./features/components/UserEngagementChart'), {
  loading: () => <DashboardPageLoadingSkeleton />,
  ssr: false,
});
const Traffic = dynamic(() => import('./features/components/Traffic'), {
  loading: () => <DashboardPageLoadingSkeleton />,
  ssr: false,
});
const ActivityLog = dynamic(() => import('./features/components/ActivityLog'), {
  loading: () => <DashboardPageLoadingSkeleton />,
  ssr: false,
});

function DashboardPageClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<TimeRange>('default');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Single query with no date params — let the backend use its default range.
  // Passing date params creates a different query key and causes a second API call.
  const { isLoading, refetch } = useDashboardSummary();

  const isPageLoading = isLoading || isRefreshing;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetch]);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  }, [queryClient]);

  return (
    <Box
      sx={{
        width: '100%',
        minWidth: 0,
        overflowX: 'hidden',
        px: { xs: 2, sm: 3, md: 4 },
        py: 4,
      }}
    >
      <PageHeader
        title="Dashboard Overview"
        defaultSubtitle="Welcome {firstName}! Here's what's happening with your platform today."
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onRefresh={handleRefresh}
        user={user}
      />

      {isPageLoading ? (
        <DashboardPageLoadingSkeleton />
      ) : (
        <>
          <DashboardAnalytics timeRange={timeRange} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
              gap: 3,
              mt: 3,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack spacing={3}>
                <UserEngagementChart timeRange={timeRange} />
                <Traffic />
              </Stack>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <ActivityLog />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}

export default memo(DashboardPageClient);
