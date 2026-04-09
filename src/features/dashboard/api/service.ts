/**
 * Dashboard Service
 */

import { api } from '@/shared/api';
import { API_CONFIG } from '@/shared/api';
import type { DashboardSummaryResponse, DashboardSummary } from './types';

export class DashboardService {
  static async getSummary(params?: { from?: string; to?: string }): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummaryResponse>(
      API_CONFIG.endpoints.dashboard.summary,
      params
    );
    if ('data' in response && response.data) {
      return response.data;
    }
    return response as unknown as DashboardSummary;
  }
}
