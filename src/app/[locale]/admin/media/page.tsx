'use client';

import { useParams } from 'next/navigation';
import { MediaReviewPage } from '@/components/media/media-review-page';

export default function AdminMediaPage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || 'en';

  return <MediaReviewPage locale={locale} role="admin" />;
}
