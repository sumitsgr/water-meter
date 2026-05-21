import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormDrawer, Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';

import { createUserInputSchema, useSaveUser } from '../api/save-user';

const roleOptions = [
  { label: 'Super Admin', value: 1 },
  { label: 'Zone Manager', value: 2 },
  { label: 'Field Operator', value: 3 },
];

const statusOptions = [
  { label: 'Active', value: 1 },
  { label: 'Inactive', value: 0 },
];

export const CreateUser = () => {
  const { addNotification } = useNotifications();
  const saveUserMutation = useSaveUser({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'User Created',
        });
      },
    },
  });

  return (
    <FormDrawer
      isDone={saveUserMutation.isSuccess}
      triggerButton={
        <Button icon={<Plus className="size-4" />} size="sm">
          Create User
        </Button>
      }
      title="Create User"
      submitButton={
        <Button
          form="create-user"
          type="submit"
          size="sm"
          isLoading={saveUserMutation.isPending}
        >
          Submit
        </Button>
      }
    >
      <Form
        id="create-user"
        onSubmit={(values) => {
          saveUserMutation.mutate({ data: values });
        }}
        options={{
          defaultValues: {
            username: '',
            email: '',
            password: '',
            role_id: 3,
            status: 1,
          },
        }}
        schema={createUserInputSchema}
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
              label="Password"
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
