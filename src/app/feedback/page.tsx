import type { Metadata } from 'next';
import { FeedbackView } from '@/components/forms/FormViews';

export const metadata: Metadata = { title: 'Rate your experience' };
type Props = { searchParams: Promise<{ topic?: string }> };

export default async function FeedbackPage({ searchParams }: Props) {
  const { topic } = await searchParams;
  return <FeedbackView topic={topic} />;
}
