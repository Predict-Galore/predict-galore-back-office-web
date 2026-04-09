/**
 * Activity Log Component
 */

'use client';

import { useState, memo, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useDashboardActivity } from '@/features/dashboard';
import { PrevNextPagination } from '@/shared/components/PrevNextPagination';

interface ActivityLogProps {
  refreshKey?: number;
}

const ITEMS_PER_PAGE = 5;

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ActivityLog = memo(function ActivityLog({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refreshKey: _refreshKey,
}: ActivityLogProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDashboardActivity();

  const activities = useMemo(() => data?.activities ?? [], [data]);
  const totalPages = useMemo(
    () => Math.ceil(activities.length / ITEMS_PER_PAGE),
    [activities.length]
  );
  const pagedActivities = useMemo(
    () => activities.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [activities, page]
  );

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(1);
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Loading activity...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <WarningIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" color="error.main">Unable to Load Activity</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!activities.length) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <WarningIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No Activity Found</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', minWidth: 0, overflowX: 'hidden' }}>
      <CardContent sx={{ minWidth: 0, overflowX: 'hidden' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>

        {pagedActivities.map((activity, index) => (
          <Box key={activity.id}>
            <Box sx={{ py: 1.5 }}>
              {/* Category — right aligned */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                <Chip label={activity.category} size="small" variant="outlined" />
              </Box>

              {/* Title */}
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
                {activity.title}
              </Typography>

              {/* Description */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                {activity.description}
              </Typography>

              {/* Actor + Date — justify between */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {activity.actorDisplayName}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDateTime(activity.createdAtUtc)}
                </Typography>
              </Stack>
            </Box>
            {index < pagedActivities.length - 1 && <Divider />}
          </Box>
        ))}

        <PrevNextPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
});

ActivityLog.displayName = 'ActivityLog';

export default ActivityLog;
