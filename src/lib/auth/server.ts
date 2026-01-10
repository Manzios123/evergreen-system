import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { redirect } from '@/i18n/routing';

interface UserPayload {
  id: string;
  email: string;
  full_name: string;
  role: 'volunteer' | 'coordinator' | 'admin';
}

export async function getServerUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('evergreen_token')?.value;
  
  if (!token) return null;
  
  try {
    const payload = jwtDecode<UserPayload>(token);
    return payload;
  } catch {
    return null;
  }
}

export async function requireRole(role: 'volunteer' | 'coordinator' | 'admin', locale: string = 'en') {
  const user = await getServerUser();
  
  if (!user) {
    redirect({ href: '/login', locale });
  }
  
  if (user!.role !== role) {
    redirect({ href: '/unauthorized', locale });
  }
  
  return user;
}

export async function requireAuth(locale: string = 'en') {
  const user = await getServerUser();
  
  if (!user) {
    redirect({ href: '/login', locale });
  }
  
  return user;
}