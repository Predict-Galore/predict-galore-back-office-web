/**
 * User Engagement Chart Component
 */

'use client';

import { useMemo, memo } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { designTokens } from '@/shared/styles/tokens';
import { useDashboardEngagement } from '@/features/dashboard';
import { TimeRange } from '@/shared/components/PageHeader';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TableLoadingState, TableErrorState } from '@/shared/components/TableStates';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface UserEngagementChartProps {
  timeRange?: TimeRange;
}

const UserEngagementChart = memo(function UserEngagementChart({
  timeRange = 'default',
}: UserEngagementChartProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _timeRange = timeRange;
  const { data, isLoading, error } = useDashboardEngagement();

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // segment 0 = all users
    const segment = data.find(s => s.segment === 0) ?? data[0];
    if (!segment?.points?.length) return [];

    const points = segment.points;

    // Filter to only points that have activity, then take the last 90 days worth.
    // The API can return 2000+ daily points spanning years — rendering all of them
    // causes Recharts to silently produce a blank chart.
    const withActivity = points.filter(p => p.activeUsers > 0);
    const lastActivityIndex = withActivity.length > 0
      ? points.indexOf(withActivity[withActivity.length - 1])
      : points.length - 1;

    // Show a 90-day window ending at the last day with activity (or today)
    const windowEnd = lastActivityIndex + 1;
    const windowStart = Math.max(0, windowEnd - 90);
    const window = points.slice(windowStart, windowEnd);

    return window.map((point) => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      activeUsers: point.activeUsers ?? 0,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <TableLoadingState message="Loading engagement data..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <TableErrorState colSpan={1} message="Failed to load engagement data" onRetry={() => {}} />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>User Engagement</Typography>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              No engagement data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 0, overflowX: 'hidden' }}>
      <CardContent sx={{ minWidth: 0, overflowX: 'hidden' }}>
        <Typography variant="h6" gutterBottom>
          User Engagement
        </Typography>
        <Box sx={{ width: '100%', height: { xs: 280, sm: 360, md: 400 }, mt: designTokens.spacing.itemGap }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stroke={theme.palette.primary.main}
                fill="url(#activeUsersGradient)"
                name="Active Users"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
});

UserEngagementChart.displayName = 'UserEngagementChart';

export default UserEngagementChart;
