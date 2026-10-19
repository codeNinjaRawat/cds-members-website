import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMembershipSettings } from '@/lib/content/loaders';
import { GuideView } from '@/components/cms/GuideView';

export const metadata: Metadata = { title: 'How to sign up' };
export default async function GuidePage() {
  const s = await getMembershipSettings();
  if (!s.guide.enabled) notFound();
  return <GuideView settings={s} />;
}
