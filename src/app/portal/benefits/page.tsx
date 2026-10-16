import type { Metadata } from 'next';
import { MyBenefits } from '@/components/account/MyBenefits';
import { getBenefits } from '@/lib/content/loaders';
import { memberSafe } from '@/lib/community/benefits';

export const metadata: Metadata = { title: 'My benefits', robots: { index: false } };

/** Member portal › My benefits (F4). Only the member-safe part of the document reaches the browser. */
export default async function BenefitsPage() {
  return <MyBenefits doc={memberSafe(await getBenefits())} />;
}
