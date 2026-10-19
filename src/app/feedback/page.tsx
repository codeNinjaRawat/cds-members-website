import type { Metadata } from 'next';
import { FeedbackView } from '@/components/forms/FormViews';
import { getSiteConfig } from '@/lib/site-config/get-site-config';

export const metadata: Metadata = { title: 'Rate your experience' };
type Props = { searchParams: Promise<{ topic?: string }> };

export default async function FeedbackPage({ searchParams }: Props) {
  const [{ topic }, site] = await Promise.all([searchParams, getSiteConfig()]);
  return <FeedbackView topic={topic} org={site.org.shortName} />;
}
