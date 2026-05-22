import { ContentLayout } from '@/components/layouts';
import { DevicesList } from '@/features/devices/components/devices-list';

const DevicesRoute = () => {
  return (
    <ContentLayout title="Devices">
      <DevicesList />
    </ContentLayout>
  );
};

export default DevicesRoute;
