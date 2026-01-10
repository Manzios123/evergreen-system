// contexts/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  console.log('🔐 AuthProvider - Current pathname:', pathname);
  console.log('🔐 AuthProvider - Current user:', user);
  console.log('🔐 AuthProvider - isLoading:', isLoading);

  // Function to extract locale from pathname
  const getCurrentLocale = () => {
    if (!pathname) return 'en';
    const segments = pathname.split('/').filter(Boolean);
    return segments[0] || 'en';
  };

  // Function to check if path is public (login, register, etc.)
  const isPublicPath = (path: string) => {
    const publicPathNames = ['login', 'register', 'forgot-password'];
    const segments = path.split('/').filter(Boolean);
    
    // If path starts with a locale, check the next segment
    if (segments.length > 0 && ['en', 'fr'].includes(segments[0])) {
      return publicPathNames.includes(segments[1]);
    }
    
    // If no locale, check the first segment
    return publicPathNames.includes(segments[0]);
  };

  const checkAuth = async () => {
    console.log('🔐 checkAuth called');
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 Token from localStorage:', token ? 'Exists' : 'None');
      
      if (!token) {
        setUser(null);
        return;
      }

      console.log('🔐 Fetching user profile...');
      const data = await api.get<{ user: User }>('/users/me');
      console.log('🔐 User profile response:', data);
      setUser(data.user);
    } catch (error) {
      console.error('🔐 Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('🔐 checkAuth completed, isLoading set to false');
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 login called with email:', email);
    try {
      const result = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      console.log('🔐 Login response:', result);
      
      if (result.token) {
        localStorage.setItem('token', result.token);
        setUser(result.user);
        console.log('🔐 User set, redirecting to dashboard...');
        
        const locale = getCurrentLocale();
        // Redirect based on role
        if (result.user?.role) {
          const redirectPath = `/${locale}/${result.user.role}/dashboard`;
          console.log('🔐 Redirecting to:', redirectPath);
          router.push(redirectPath);
        } else {
          console.log('🔐 No role, redirecting to /dashboard');
          router.push(`/${locale}/dashboard`);
        }
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('🔐 logout called');
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('🔐 Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      const locale = getCurrentLocale();
      console.log('🔐 User cleared, redirecting to login');
      router.push(`/${locale}/login`);
    }
  };

  useEffect(() => {
    console.log('🔐 AuthProvider mounted, calling checkAuth');
    checkAuth();
  }, []);

  // Protect routes based on authentication
  useEffect(() => {
    console.log('🔐 Route protection effect running');
    console.log('🔐 - pathname:', pathname);
    console.log('🔐 - user:', user);
    console.log('🔐 - isLoading:', isLoading);
    
    if (isLoading) {
      console.log('🔐 Still loading, skipping protection check');
      return;
    }

    // Check if current path is public
    const pathIsPublic = isPublicPath(pathname || '');
    console.log('🔐 Is public path?', pathIsPublic);

    // If not authenticated and not on a public path, redirect to login
    if (!user && !pathIsPublic) {
      const locale = getCurrentLocale();
      console.log('🔐 Not authenticated, redirecting to:', `/${locale}/login`);
      router.push(`/${locale}/login`);
      return;
    }

    // If authenticated and trying to access login page, redirect to dashboard
    if (user && pathIsPublic) {
      const locale = getCurrentLocale();
      console.log('🔐 Already authenticated, redirecting to dashboard');
      if (user.role) {
        router.push(`/${locale}/${user.role}/dashboard`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
      return;
    }

    // Role-based route protection
    if (user && pathname && !pathIsPublic) {
      console.log('🔐 User exists, checking role-based protection');
      const segments = pathname.split('/').filter(Boolean);
      const userRole = user.role;
      console.log('🔐 - Path segments:', segments);
      console.log('🔐 - User role:', userRole);
      
      // Skip locale segment for role checking
      const startIndex = ['en', 'fr'].includes(segments[0]) ? 1 : 0;
      const roleSegment = segments[startIndex];
      
      // If trying to access role-specific routes with wrong role
      if (roleSegment && ['admin', 'coordinator', 'volunteer'].includes(roleSegment) && roleSegment !== userRole) {
        const locale = getCurrentLocale();
        console.log('🔐 Role mismatch, redirecting to:', `/${locale}/${userRole}/dashboard`);
        router.push(`/${locale}/${userRole}/dashboard`);
      }
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}