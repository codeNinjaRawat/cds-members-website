import type { Metadata } from 'next';
import { getGiving } from '@/lib/content/loaders';
import { GiveView } from '@/components/giving/GivingViews';

export const metadata: Metadata = { title: 'Give', description: 'Give to families, clinics and masajid in Greater Houston.' };

/** Content: GET /public/giving (admin: CMS › Giving). DEMO data until the BE is ready. */
export default async function Page() {
  return <GiveView giving={await getGiving()} />;
}
