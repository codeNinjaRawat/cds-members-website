import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMembershipSettings } from '@/lib/content/loaders';
import { IdentityPolicyView } from '@/components/cms/GuideView';

export const metadata: Metadata = { title: 'Identity Collection and Verification Policy' };
export default async function IdentityPolicyPage() {
  const s = await getMembershipSettings();
  if (!s.identity.policy.enabled || s.identity.policy.url) notFound();
  return <IdentityPolicyView settings={s} />;
}
