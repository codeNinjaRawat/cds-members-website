import type { Metadata } from 'next';
import { getGiving, getMembershipSettings } from '@/lib/content/loaders';
import { monthlyOffer } from '@/lib/content/membership';
import { GiveView } from '@/components/giving/GivingViews';

export const metadata: Metadata = { title: 'Give', description: 'Give to families, clinics and masajid in Greater Houston.' };

/** Content: GET /public/giving (admin: CMS › Giving). DEMO data until the BE is ready. */
export default async function Page() {
  const [giving, ms] = await Promise.all([getGiving(), getMembershipSettings()]);
  return <GiveView giving={giving} offer={monthlyOffer(ms)} />;
}
