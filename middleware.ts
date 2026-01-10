import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en', 'rw', 'fr'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  // Get accepted languages from browser
  const acceptLanguage = request.headers.get('accept-language') || '';
  const headers = { 'accept-language': acceptLanguage };
  const languages = new Negotiator({ headers }).languages();
  
  try {
    return match(languages, locales, defaultLocale);
  } catch {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the pathname already contains a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // If it has locale, let it through
  if (pathnameHasLocale) return NextResponse.next();
  
  // If it's the root path, redirect to locale-based login
  if (pathname === '/') {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}/login`;
    return NextResponse.redirect(request.nextUrl);
  }
  
  // For other paths without locale, add locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, images, etc.)
    '/((?!_next|api|favicon.ico|evergreen_logo.JPG|.*\\.).*)',
  ],
};