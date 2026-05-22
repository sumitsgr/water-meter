import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type DashboardSummary = {
  total_devices: number;
  active_alarms: number;
  today_flow: number | null;
  monthly_flow: number | null;
};

export type ZoneStats = {
  id: number;
  title: string;
  areacode: string;
  total_devices: number | null;
  active_devices: number | null;
  today_flow: number | null;
  monthly_flow: number | null;
  update_time: string | null;
};

export const getDashboardSummary = (): Promise<{ data: DashboardSummary }> =>
  api.get('/dashboard/summary');

export const useDashboardSummary = () =>
  useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 30000, // refresh every 30 seconds
  });

export const useZoneStats = () =>
  useQuery({
    queryKey: ['zone-stats'],
    queryFn: (): Promise<{ data: ZoneStats[] }> => api.get('/dashboard/zones'),
    refetchInterval: 30000,
  });
