import { redirect } from 'next/navigation';

export default function HomePage() {
  // Default redirect to English login
  // Middleware will handle locale detection
  redirect('/en/login');
}