/**
 * Dashboard API Hooks
 * All data comes from a single useDashboardSummary call — no duplicate requests.
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService } from './service';
import { useMemo } from 'react';

export function useDashboardSummary(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['dashboard-summary', params],
    queryFn: () => DashboardService.getSummary(params),
    staleTime: 60 * 1000, // 1 minute — prevents refetch storms
  });
}

/** Derived from summary — no extra network call */
export function useDashboardEngagement(params?: { from?: string; to?: string }) {
  const { data: summary, isLoading, error } = useDashboardSummary(params);
  const data = useMemo(() => summary?.engagement ?? [], [summary]);
  return { data, isLoading, error };
}

/** Derived from summary — no extra network call */
export function useDashboardTraffic(params?: { from?: string; to?: string }) {
  const { data: summary, isLoading, error } = useDashboardSummary(params);
  const data = useMemo(
    () => summary?.traffic ?? { dimension: 0, items: [] },
    [summary]
  );
  return { data, isLoading, error };
}

/** Derived from summary — no extra network call */
export function useDashboardActivity(params?: { from?: string; to?: string }) {
  const { data: summary, isLoading, error } = useDashboardSummary(params);
  const data = useMemo(
    () => ({
      activities: summary?.recentActivity?.resultItems ?? [],
      total: summary?.recentActivity?.totalItems ?? 0,
      totalPages: summary?.recentActivity?.totalPages ?? 0,
    }),
    [summary]
  );
  return { data, isLoading, error };
}
