/**
 * Markets Page (Client)
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { PageHeader } from '@/shared/components/PageHeader';
import { designTokens } from '@/shared/styles/tokens';
import dynamic from 'next/dynamic';
import { MarketsPageLoadingSkeleton } from './features/components/MarketsPageLoadingSkeleton';
import { useMarkets, MarketsFilter, Market, MarketsService } from '@/features/markets';
import { useQueryClient } from '@tanstack/react-query';

const MarketsTable = dynamic(() => import('./features/components/MarketsTable').then((mod) => mod.MarketsTable), {
  loading: () => <MarketsPageLoadingSkeleton />,
  ssr: false,
});
const MarketAnalytics = dynamic(() => import('./features/components/MarketAnalytics').then((mod) => mod.MarketAnalytics), {
  loading: () => <MarketsPageLoadingSkeleton />,
  ssr: false,
});

export default function MarketsPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFilters] = useState<MarketsFilter>({
    page: 1,
    pageSize: 10,
  });
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const { data, isLoading, error, refetch } = useMarkets(filters);

  const markets = useMemo(() => data?.markets || [], [data?.markets]);
  const pagination = useMemo(() => {
    if (!data?.pagination) return null;
    return {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.totalPages,
    };
  }, [data]);

  // Derive analytics from the already-fetched markets data — no extra API call needed.
  const analytics = useMemo(
    () => (data ? MarketsService.computeAnalytics(markets, data.pagination.total) : null),
    [markets, data]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['markets'] });
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, queryClient]);

  const handleAddMarket = useCallback(() => {
    router.push('/predictions/markets/new');
  }, [router]);

  const handleFilterChange = useCallback((newFilters: Partial<MarketsFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ page: 1, pageSize: 10 });
  }, []);

  const handleMarketSelect = useCallback((market: Market | null) => {
    setSelectedMarket(market);
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 2, sm: 3, md: 4 },
        py: designTokens.spacing.xl,
      }}
    >
      <PageHeader
        title="Markets"
        subtitle="Manage prediction markets and selections"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <Box sx={{ mt: designTokens.spacing.sectionGap }}>
        <MarketAnalytics analytics={analytics} isLoading={isLoading} />
      </Box>

      <Box sx={{ mt: designTokens.spacing.sectionGap }}>
        <MarketsTable
          markets={markets}
          pagination={pagination}
          isLoading={isLoading || isRefreshing}
          error={error}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onAddMarket={handleAddMarket}
          onRefresh={handleRefresh}
          selectedMarket={selectedMarket}
          onMarketSelect={handleMarketSelect}
        />
      </Box>
    </Box>
  );
}
