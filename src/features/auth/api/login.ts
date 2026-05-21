import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { LoginInput, User } from '../types';

type LoginResponse = { token: string; user: User };

export const login = (data: LoginInput): Promise<LoginResponse> =>
  api.post('/auth/login', data);

export const useLogin = () =>
  useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
    },
  });
