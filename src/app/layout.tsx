import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import  AuthProvider  from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Evergreen',
  description: 'Volunteer management system for the Evergreen program',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}