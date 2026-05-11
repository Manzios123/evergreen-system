// src/components/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout, getCurrentUser, isAuthenticated } from '@/lib/auth';
import { usersApi } from '@/lib/api/users';

interface User {
  id: string;
  email: string;
  full_name: string;
  name?: string;
  phone?: string;
  role: 'volunteer' | 'facilitator' | 'coordinator' | 'admin';
  pilot_ids?: string[];
  school_ids?: string[];
  profile_picture?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getPrimaryRole(raw: any): User['role'] {
  if (raw?.role) return raw.role;
  const roles = Array.isArray(raw?.roles) ? raw.roles : [];
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('coordinator')) return 'coordinator';
  if (roles.includes('facilitator')) return 'facilitator';
  return 'volunteer';
}

function normalizeUser(raw: any): User {
  const fullName = raw?.full_name || raw?.fullName || raw?.name || '';

  return {
    ...raw,
    full_name: fullName,
    name: raw?.name || fullName,
    role: getPrimaryRole(raw),
    pilot_ids: raw?.pilot_ids || [],
    school_ids: raw?.school_ids || [],
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Refresh user from token (useful after profile update)
  const refreshUser = async () => {
    if (isAuthenticated()) {
      try {
        const data = await usersApi.getMe();
        setUser(normalizeUser(data.user));
      } catch {
        const userData = getCurrentUser();
        setUser(userData ? normalizeUser(userData) : null);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        const userData = getCurrentUser();
        setUser(userData ? normalizeUser(userData) : null);
        try {
          const data = await usersApi.getMe();
          setUser(normalizeUser(data.user));
        } catch {
          // Keep the token-derived user if the profile refresh is unavailable.
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin(email, password);
      setUser(normalizeUser(response.user));
      try {
        const data = await usersApi.getMe();
        setUser(normalizeUser(data.user));
      } catch {
        // The login response still contains enough identity for routing.
      }
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const currentLocale = typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean)[0]
      : 'en';
    const locale = ['en', 'fr', 'rw'].includes(currentLocale) ? currentLocale : 'en';
    apiLogout();
    setUser(null);
    router.push(`/${locale}/login`);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
