// components/layout/role-layout.tsx
'use client';

import { useAuth } from '@/components/providers/AuthProvider'; // Changed import
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './mobile-nav';
import { useParams, useRouter } from 'next/navigation'; // Add this

interface RoleLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'coordinator' | 'volunteer' | 'facilitator';
}

export default function RoleLayout({ children, role }: RoleLayoutProps) {
  const router = useRouter(); // Initialize router
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, isLoading } = useAuth();

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
    <div className="min-h-screen bg-gray-50">
      <MobileNav />
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar role={user.role === 'facilitator' && role === 'volunteer' ? 'facilitator' : role} />
      </div>
      
      <div className="lg:pl-72">
        <Header />
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 lg:px-8">
          The system is currently under maintenance. Some features may be temporarily unavailable while improvements are being completed.
        </div>
        
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
