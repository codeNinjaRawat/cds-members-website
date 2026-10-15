import type { Metadata } from 'next';
import { getGiving } from '@/lib/content/loaders';
import { NeedsView } from '@/components/giving/GivingViews';

export const metadata: Metadata = { title: 'Who still needs help', description: 'Verified cases from the ISGH community you can help today.' };

/** Content: GET /public/giving (admin: CMS › Giving). DEMO data until the BE is ready. */
export default async function Page() {
  return <NeedsView giving={await getGiving()} />;
}
