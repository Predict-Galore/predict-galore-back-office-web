/**
 * Activity Log Component
 * Clean, simple implementation
 */

'use client';

import { useState, memo, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import { designTokens } from '@/shared/styles/tokens';
import {
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useDashboardActivity } from '@/features/dashboard';
import { PrevNextPagination } from '@/shared/components/PrevNextPagination';

interface ActivityLogProps {
  refreshKey?: number;
}

const ITEMS_PER_PAGE = 5;

// Helper function to format timestamps relative to now
const formatTimestamp = (timestamp: string): string => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return activityTime.toLocaleDateString();
};

const ActivityLog = memo(function ActivityLog({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refreshKey: _refreshKey 
}: ActivityLogProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDashboardActivity();

  const activities = useMemo(() => data?.activities || [], [data?.activities]);
  const totalItems = useMemo(() => activities.length, [activities.length]);
  const totalPages = useMemo(() => Math.ceil(totalItems / ITEMS_PER_PAGE), [totalItems]);
  const pagedActivities = useMemo(
    () => activities.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [activities, page]
  );

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading activity...
            </Typography>
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
            <Typography variant="h6" color="error.main" gutterBottom>
              Unable to Load Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Failed to load activity
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <WarningIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Activity Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No activity found
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', minWidth: 0, overflowX: 'hidden' }}>
      <CardContent sx={{ minWidth: 0, overflowX: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1}
          sx={{ mb: designTokens.spacing.itemGap }}
        >
          <Typography variant="h6">Recent Activity</Typography>
        </Stack>

        <List>
          {pagedActivities.map((activity, index) => (
            <Box key={activity.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {activity.actorDisplayName?.[0]?.toUpperCase() || activity.title?.[0]?.toUpperCase() || activity.category?.[0]?.toUpperCase() || 'A'}
                </Avatar>
                <ListItemText
                  sx={{ minWidth: 0 }}
                  primary={activity.title}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {activity.description}
                      </Typography>
                      {activity.actorDisplayName && (
                        <>
                          <br />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {activity.actorDisplayName}
                            {activity.actorRole && ` • ${activity.actorRole}`}
                          </Typography>
                        </>
                      )}
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {formatTimestamp(activity.createdAtUtc)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < pagedActivities.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          ))}
        </List>

        <PrevNextPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
});

ActivityLog.displayName = 'ActivityLog';

export default ActivityLog;
