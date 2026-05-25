import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Device } from '../types';

type DeviceFilters = {
  zone_id?: number;
  ward_id?: number;
  status?: number;
  search?: string;
};

export const getDevices = (
  filters: DeviceFilters = {},
): Promise<{ data: Device[]; total: number }> => {
  return api.get('/devices', { params: filters });
};

export const useDevices = (filters: DeviceFilters = {}) => {
  return useQuery({
    queryKey: ['devices', filters],
    queryFn: () => getDevices(filters),
  });
};
