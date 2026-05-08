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
        setUser(data.user as User);
      } catch {
        const userData = getCurrentUser();
        setUser(userData);
      }
    }
  };

  useEffect(() => {
    const initAuth = () => {
      if (isAuthenticated()) {
        const userData = getCurrentUser();
        setUser(userData);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
