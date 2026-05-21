import { Pen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormDrawer, Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { User } from '@/types/api';

import { useSaveUser, userInputSchema } from '../api/save-user';

const roleOptions = [
  { label: 'Super Admin', value: 1 },
  { label: 'Zone Manager', value: 2 },
  { label: 'Field Operator', value: 3 },
];

const statusOptions = [
  { label: 'Active', value: 1 },
  { label: 'Inactive', value: 0 },
];

export const UpdateUser = ({ user }: { user: User }) => {
  const { addNotification } = useNotifications();
  const saveUserMutation = useSaveUser({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'User Updated',
        });
      },
    },
  });

  return (
    <FormDrawer
      isDone={saveUserMutation.isSuccess}
      triggerButton={
        <Button icon={<Pen className="size-4" />} size="sm" variant="outline">
          Edit
        </Button>
      }
      title="Update User"
      submitButton={
        <Button
          form={`update-user-${user.id}`}
          type="submit"
          size="sm"
          isLoading={saveUserMutation.isPending}
        >
          Submit
        </Button>
      }
    >
      <Form
        id={`update-user-${user.id}`}
        onSubmit={(values) => {
          saveUserMutation.mutate({
            data: {
              ...values,
              id: user.id,
              password: values.password || undefined,
            },
          });
        }}
        options={{
          defaultValues: {
            username: user.username ?? '',
            email: user.email,
            password: '',
            role_id: user.role_id ?? 3,
            status: user.status ?? 1,
          },
        }}
        schema={userInputSchema}
      >
        {({ register, formState }) => (
          <>
            <Input
              label="Username"
              error={formState.errors['username']}
              registration={register('username')}
            />
            <Input
              label="Email Address"
              type="email"
              error={formState.errors['email']}
              registration={register('email')}
            />
            <Input
              label="New Password"
              type="password"
              error={formState.errors['password']}
              registration={register('password')}
            />
            <Select
              label="Role"
              options={roleOptions}
              error={formState.errors['role_id']}
              registration={register('role_id', { valueAsNumber: true })}
            />
            <Select
              label="Status"
              options={statusOptions}
              error={formState.errors['status']}
              registration={register('status', { valueAsNumber: true })}
            />
          </>
        )}
      </Form>
    </FormDrawer>
  );
};
