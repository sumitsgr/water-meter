import { Spinner } from '@/components/ui/spinner';
import { Table } from '@/components/ui/table';
import { formatDate } from '@/utils/format';

import { useUsers } from '../api/get-users';

import { DeleteUser } from './delete-user';
import { UpdateUser } from './update-user';

export const UsersList = () => {
  const usersQuery = useUsers();

  if (usersQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const users = usersQuery.data?.data;

  if (!users) return null;

  return (
    <Table
      data={users}
      columns={[
        {
          title: 'Name',
          field: 'username',
        },
        {
          title: 'Email',
          field: 'email',
        },
        {
          title: 'Role',
          field: 'role_name',
          Cell({ entry }) {
            return <span>{entry.role_name || entry.role_id || '-'}</span>;
          },
        },
        {
          title: 'Status',
          field: 'status',
          Cell({ entry: { status } }) {
            return <span>{status === 1 ? 'Active' : 'Inactive'}</span>;
          },
        },
        {
          title: 'Created At',
          field: 'created_at',
          Cell({ entry: { created_at } }) {
            return <span>{formatDate(created_at)}</span>;
          },
        },
        {
          title: '',
          field: 'id',
          Cell({ entry }) {
            return (
              <div className="flex items-center gap-2">
                <UpdateUser user={entry} />
                <DeleteUser id={entry.id} />
              </div>
            );
          },
        },
      ]}
    />
  );
};
