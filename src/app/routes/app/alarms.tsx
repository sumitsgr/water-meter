import { ContentLayout } from '@/components/layouts';
import { AlarmsList } from '@/features/alarms/components/alarms-list';

const AlarmsRoute = () => {
  return (
    <ContentLayout title="Alarms">
      <AlarmsList />
    </ContentLayout>
  );
};

export default AlarmsRoute;
