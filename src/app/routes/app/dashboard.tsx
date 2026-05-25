import { ContentLayout } from '@/components/layouts';
import { Spinner } from '@/components/ui/spinner';
import {
  useDashboardSummary,
  useZoneStats,
} from '@/features/dashboard/api/get-stats';
import { formatDate } from '@/utils/format';

const formatNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const DashboardRoute = () => {
  const summaryQuery = useDashboardSummary();
  const zoneStatsQuery = useZoneStats();

  if (summaryQuery.isLoading || zoneStatsQuery.isLoading) {
    return (
      <ContentLayout title="Dashboard">
        <div className="flex h-48 w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ContentLayout>
    );
  }

  const summary = summaryQuery.data?.data;
  const zones = zoneStatsQuery.data?.data ?? [];

  return (
    <ContentLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border bg-white p-4">
          <p className="text-sm text-muted-foreground">Total Devices</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(summary?.total_devices)}
          </p>
        </div>
        <div className="rounded-md border bg-white p-4">
          <p className="text-sm text-muted-foreground">Active Alarms</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(summary?.active_alarms)}
          </p>
        </div>
        <div className="rounded-md border bg-white p-4">
          <p className="text-sm text-muted-foreground">Today Flow</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(summary?.today_flow)}
          </p>
        </div>
        <div className="rounded-md border bg-white p-4">
          <p className="text-sm text-muted-foreground">Monthly Flow</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(summary?.monthly_flow)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border bg-white">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Zone Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Zone</th>
                <th className="px-4 py-3 font-medium">Area Code</th>
                <th className="px-4 py-3 font-medium">Devices</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Today Flow</th>
                <th className="px-4 py-3 font-medium">Monthly Flow</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{zone.title}</td>
                  <td className="px-4 py-3">{zone.areacode}</td>
                  <td className="px-4 py-3">
                    {formatNumber(zone.total_devices)}
                  </td>
                  <td className="px-4 py-3">
                    {formatNumber(zone.active_devices)}
                  </td>
                  <td className="px-4 py-3">{formatNumber(zone.today_flow)}</td>
                  <td className="px-4 py-3">
                    {formatNumber(zone.monthly_flow)}
                  </td>
                  <td className="px-4 py-3">
                    {zone.update_time ? formatDate(zone.update_time) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ContentLayout>
  );
};

export default DashboardRoute;
