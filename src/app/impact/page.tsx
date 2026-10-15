import type { Metadata } from 'next';
import { getGiving } from '@/lib/content/loaders';
import { ImpactView } from '@/components/giving/GivingViews';

export const metadata: Metadata = { title: 'How we helped', description: 'Real programs and stories from the ISGH community.' };

/** Content: GET /public/giving (admin: CMS › Giving). DEMO data until the BE is ready. */
export default async function Page() {
  return <ImpactView giving={await getGiving()} />;
}
