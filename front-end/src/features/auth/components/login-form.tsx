import { useState } from 'react';

import { useLogin } from '@/lib/auth';

type LoginFormProps = {
  onSuccess?: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess,
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        {/* <label className="mb-1 block text-sm font-medium">Email</label> */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="admin@waterboard.com"
          required
        />
      </div>
      <div>
        {/* <label className="mb-1 block text-sm font-medium">Password</label> */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="Password@123"
          required
        />
      </div>
      {login.isError && (
        <p className="text-sm text-red-500">Invalid email or password.</p>
      )}
      <button
        type="submit"
        disabled={login.isPending}
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {login.isPending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
