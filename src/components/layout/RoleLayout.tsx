// components/layout/role-layout.tsx
'use client';

import { useAuth } from '@/components/providers/AuthProvider'; // Changed import
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './mobile-nav';
import { useParams, useRouter } from 'next/navigation'; // Add this
import { useEffect, useState } from 'react';

interface RoleLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'coordinator' | 'volunteer' | 'facilitator';
}

export default function RoleLayout({ children, role }: RoleLayoutProps) {
  const router = useRouter(); // Initialize router
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, isLoading } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('evergreen-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light');
    setSidebarCollapsed(window.localStorage.getItem('evergreen-sidebar-collapsed') === 'true');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('evergreen-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('evergreen-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const canUseLayout = user?.role === role || (role === 'volunteer' && user?.role === 'facilitator');

  if (!user || !canUseLayout) {
    // Redirect to appropriate page based on user role or to login
    if (user) {
      // User exists but wrong role - redirect to their dashboard
      switch(user.role) {
        case 'admin':
          router.push(`/${locale}/admin/dashboard`);
          break;
        case 'coordinator':
          router.push(`/${locale}/coordinator/dashboard`);
          break;
        case 'volunteer':
          router.push(`/${locale}/volunteer/dashboard`);
          break;
        case 'facilitator':
          router.push(`/${locale}/volunteer/dashboard`);
          break;
        default:
          router.push(`/${locale}/dashboard`);
      }
    } else {
      // No user - redirect to login
      router.push(`/${locale}/login`);
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-gray-100">
      <MobileNav />
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        <Sidebar
          role={user.role === 'facilitator' && role === 'volunteer' ? 'facilitator' : role}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
      </div>
      
      <div className={sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}>
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        />
        
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
