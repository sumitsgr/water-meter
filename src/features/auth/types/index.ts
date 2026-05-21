export type User = {
  id: number;
  username: string;
  email: string;
  role: 'Super Admin' | 'Zone Manager' | 'Field Operator';
  firstName?: string;
  lastName?: string;
  bio?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  error: number;
  message: string;
  token: string;
  user: User;
};

export type AuthUser = User & {
  token?: string;
};
