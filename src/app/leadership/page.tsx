import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LeadershipView } from '@/components/leadership/LeadershipView';
import { getOfficials, getOrgStructure } from '@/lib/content/loaders';
import { publicOfficials } from '@/lib/community/officials';

export const metadata: Metadata = { title: 'Leadership', description: 'The elected leaders of ISGH: the Board, Zonal Directors, and the leadership of every Islamic Center. Find your representatives by ZIP code.' };

/** F5 public Leadership page. Only publicOfficials() reaches the browser (no member IDs, no vacancy reasons). */
export default async function LeadershipPage() {
  const [doc, map] = await Promise.all([getOfficials(), getOrgStructure()]);
  if (!doc.website.enabled) notFound();
  const zones = map.zones.filter((z) => z.active).map((z) => ({ id: z.id, name: z.name, zips: z.zips }));
  const centers = map.centers.filter((c) => c.active).map((c) => ({ name: c.name, zone: c.zone }));
  return <LeadershipView people={publicOfficials(doc, new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }))} zones={zones} centers={centers} findByZip={doc.website.findByZip} />;
}
