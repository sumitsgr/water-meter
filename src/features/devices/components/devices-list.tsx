import { Spinner } from '@/components/ui/spinner';
import { Table } from '@/components/ui/table';
import { formatDate } from '@/utils/format';

import { useDevices } from '../api/get-devices';

const statusText = (status: number) => (status === 1 ? 'Active' : 'Inactive');

export const DevicesList = () => {
  const devicesQuery = useDevices();

  if (devicesQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const devices = devicesQuery.data?.data;

  if (!devices) return null;

  return (
    <Table
      data={devices}
      columns={[
        {
          title: 'Device ID',
          field: 'device_id',
        },
        {
          title: 'Meter ID',
          field: 'meter_id',
        },
        {
          title: 'Customer',
          field: 'cust_name',
        },
        {
          title: 'Zone',
          field: 'zone_name',
        },
        {
          title: 'Ward',
          field: 'ward_name',
        },
        {
          title: 'Last Reading',
          field: 'last_reading',
        },
        {
          title: 'Last Seen',
          field: 'last_seen',
          Cell({ entry: { last_seen } }) {
            return <span>{last_seen ? formatDate(last_seen) : '-'}</span>;
          },
        },
        {
          title: 'Status',
          field: 'status',
          Cell({ entry: { status } }) {
            return <span>{statusText(status)}</span>;
          },
        },
      ]}
    />
  );
};
