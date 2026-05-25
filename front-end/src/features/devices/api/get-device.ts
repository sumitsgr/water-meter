import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Consumption, Device } from '../types';

export const getDevice = (deviceId: string): Promise<{ data: Device }> => {
  return api.get(`/devices/${deviceId}`);
};

export const useDevice = (deviceId: string) => {
  return useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => getDevice(deviceId),
    enabled: Boolean(deviceId),
  });
};

export const getDeviceConsumption = ({
  deviceId,
  type = 'daily',
  days = 30,
}: {
  deviceId: string;
  type?: 'daily' | 'monthly';
  days?: number;
}): Promise<{ data: Consumption[] }> => {
  return api.get(`/devices/${deviceId}/consumption`, {
    params: { type, days },
  });
};

export const useDeviceConsumption = (
  deviceId: string,
  type: 'daily' | 'monthly' = 'daily',
) => {
  return useQuery({
    queryKey: ['device-consumption', deviceId, type],
    queryFn: () => getDeviceConsumption({ deviceId, type }),
    enabled: Boolean(deviceId),
  });
};
