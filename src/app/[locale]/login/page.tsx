'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user]);
  
  const redirectBasedOnRole = (role: string) => {
    switch(role) {
      case 'admin':
        router.push('/admin/dashboard');
        break;
      case 'coordinator':
        router.push('/coordinator/dashboard');
        break;
      case 'volunteer':
        router.push('/volunteer/dashboard');
        break;
      case 'facilitator':
        router.push('/volunteer/dashboard');
        break;
      default:
        router.push('/dashboard');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await login(email, password);
    } catch (err: any) {
      if (err?.status === 401 || err?.error === 'Invalid credentials') {
        setError('Incorrect email or password. Please try again.');
      } else if (err?.status === 403 || err?.error === 'Account disabled') {
        setError(err?.message || 'Your account is not active. Please contact an administrator.');
      } else {
        setError('Unable to sign in right now. Please try again.');
      }
    }
  };
  
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-background px-4 py-6 text-foreground sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
            <div className="relative h-12 w-12 sm:h-16 sm:w-16">
              <Image
                src="/evergreen-mark.png"
                alt="Evergreen Logo"
                className="dark:brightness-150"
                fill
                sizes="(min-width: 640px) 64px, 48px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
        </div>
        
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-center text-base text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>
      
      <div className="mx-auto mt-6 w-full max-w-md sm:mt-8">
        <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8">
          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {tCommon('email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block min-h-12 w-full rounded-lg border border-input bg-background px-3 py-3 text-base text-foreground shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {tCommon('password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block min-h-12 w-full rounded-lg border border-input bg-background px-3 py-3 text-base text-foreground shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex min-h-11 items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 flex min-h-11 items-center text-sm text-foreground">
                  {tCommon('rememberMe')}
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="inline-flex min-h-11 items-center font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300">
                  {tCommon('forgotPassword')}
                </a>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('signingIn')}
                  </>
                ) : (
                  tCommon('signIn')
                )}
              </button>
            </div>
          </form>
          
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm leading-6 text-muted-foreground">
            © {new Date().getFullYear()} Evergreen Volunteer System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
