import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrgStructure, getRecords } from '@/lib/content/loaders';
import { recordsFor } from '@/lib/community/records';
import { RecordsPageView } from '@/components/records/RecordsPage';

export const metadata: Metadata = { title: 'Records' };
/** R1 public records page. Only public records reach the browser; members-only ones are served in the portal. */
export default async function RecordsPage() {
  const [d, map] = await Promise.all([getRecords(), getOrgStructure()]);
  if (!d.website.enabled) notFound();
  return <RecordsPageView title={d.website.title} intro={d.website.intro} items={recordsFor(d, 'public')} centerOrder={map.centers.map((c) => c.name)} />;
}
