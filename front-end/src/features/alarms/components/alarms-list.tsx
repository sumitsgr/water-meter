import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Table } from '@/components/ui/table';
import { formatDate } from '@/utils/format';

import { useAlarms, useResolveAlarm } from '../api/get-alarms';

export const AlarmsList = () => {
  const alarmsQuery = useAlarms();
  const resolveAlarm = useResolveAlarm();

  if (alarmsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const alarms = alarmsQuery.data?.data;

  if (!alarms) return null;

  return (
    <Table
      data={alarms}
      columns={[
        {
          title: 'Device ID',
          field: 'device_id',
        },
        {
          title: 'Customer',
          field: 'cust_name',
          Cell({ entry: { cust_name } }) {
            return <span>{cust_name || '-'}</span>;
          },
        },
        {
          title: 'Zone',
          field: 'zone_name',
          Cell({ entry: { zone_name } }) {
            return <span>{zone_name || '-'}</span>;
          },
        },
        {
          title: 'Ward',
          field: 'ward_name',
          Cell({ entry: { ward_name } }) {
            return <span>{ward_name || '-'}</span>;
          },
        },
        {
          title: 'Alarm',
          field: 'alarm_name',
          Cell({ entry }) {
            return <span>{entry.alarm_name || entry.alarm_type || '-'}</span>;
          },
        },
        {
          title: 'Recorded',
          field: 'record_time',
          Cell({ entry: { record_time } }) {
            return <span>{record_time ? formatDate(record_time) : '-'}</span>;
          },
        },
        {
          title: 'Status',
          field: 'resolved',
          Cell({ entry: { resolved } }) {
            return <span>{resolved === 1 ? 'Resolved' : 'Open'}</span>;
          },
        },
        {
          title: '',
          field: 'id',
          Cell({ entry: { id, resolved } }) {
            if (resolved === 1) return <span />;

            return (
              <Button
                size="sm"
                variant="outline"
                isLoading={resolveAlarm.isPending}
                onClick={() => resolveAlarm.mutate(id)}
              >
                Resolve
              </Button>
            );
          },
        },
      ]}
    />
  );
};
