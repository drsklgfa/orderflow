'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api';
import type { User } from './types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const result = await apiFetch<{ user: User; csrfToken: string }>('/auth/me');
      sessionStorage.setItem('orderflow_csrf', result.csrfToken);
      setUser(result.user);
    } catch {
      sessionStorage.removeItem('orderflow_csrf');
      setUser(null);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const login = async (email: string, password: string) => {
    const result = await apiFetch<{ user: User; csrfToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), skipRefresh: true });
    sessionStorage.setItem('orderflow_csrf', result.csrfToken);
    setUser(result.user);
    return result.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await apiFetch<{ user: User; csrfToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }), skipRefresh: true });
    sessionStorage.setItem('orderflow_csrf', result.csrfToken);
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST', skipRefresh: true }).catch(() => undefined);
    sessionStorage.removeItem('orderflow_csrf');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, reload }), [user, loading, reload]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
