'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function FacilitatorDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    router.replace(`/${locale}/volunteer/dashboard`);
  }, [locale, router]);

  return null;
}
