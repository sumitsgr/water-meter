import { configureAuth } from 'react-query-auth';
import { Navigate } from 'react-router';

import { api } from '@/lib/api-client';

type User = {
  id: number;
  username: string;
  email: string;
  role: 'Super Admin' | 'Zone Manager' | 'Field Operator';
  firstName?: string;
  lastName?: string;
  bio?: string;
};

type LoginResponse = {
  error: number;
  message: string;
  token: string;
  user: User;
};

async function getUser(): Promise<User | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
}

async function loginFn(data: {
  email: string;
  password: string;
}): Promise<User> {
  const res = await api.post<unknown, LoginResponse>('/auth/login', data);
  localStorage.setItem('token', res.token);
  return res.user;
}

async function logoutFn(): Promise<void> {
  localStorage.removeItem('token');
}

async function registerFn(): Promise<User> {
  throw new Error('Registration not supported');
}

export const { useUser, useLogin, useLogout, useRegister, AuthLoader } =
  configureAuth({
    userFn: getUser,
    loginFn,
    logoutFn,
    registerFn,
  });

// ✅ ADD THIS — protects routes that require login
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useUser();

  if (!user.data) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
