import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getUsersQueryOptions } from './get-users';

export const userInputSchema = z.object({
  username: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z.string().optional(),
  role_id: z.coerce.number().min(1, 'Required'),
  status: z.coerce.number(),
});

export const createUserInputSchema = userInputSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type UserInput = z.infer<typeof userInputSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const saveUser = ({
  data,
}: {
  data: UserInput & { id?: string | number };
}) => {
  return api.post('/users/save', data);
};

type UseSaveUserOptions = {
  mutationConfig?: MutationConfig<typeof saveUser>;
};

export const useSaveUser = ({ mutationConfig }: UseSaveUserOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getUsersQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: saveUser,
  });
};
