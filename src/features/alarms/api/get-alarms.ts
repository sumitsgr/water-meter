import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type Alarm = {
  id: number;
  device_id: string;
  alarm_type?: string;
  alarm_name?: string;
  message?: string;
  record_time: string;
  resolved: number;
  cust_name?: string;
  cust_address?: string;
  zone_name?: string;
  ward_name?: string;
};

export const useAlarms = (resolved?: number) =>
  useQuery({
    queryKey: ['alarms', resolved],
    queryFn: (): Promise<{ data: Alarm[]; total: number }> =>
      api.get('/alarms', { params: { resolved } }),
  });

export const useResolveAlarm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/alarms/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });
};
