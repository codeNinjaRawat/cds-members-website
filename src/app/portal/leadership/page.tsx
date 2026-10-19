import type { Metadata } from 'next';
import { getOfficials, getOrgStructure } from '@/lib/content/loaders';
import { memberPastLeadership } from '@/lib/community/officials';
import { PortalLeadership } from '@/components/account/PortalWork';

export const metadata: Metadata = { title: 'Who served', robots: { index: false } };

/** Member portal › Who served (E1 history). Names, seats and terms only – no member IDs or emails. Live: GET /member/leadership. */
export default async function Page() {
  const [doc, map] = await Promise.all([getOfficials(), getOrgStructure()]);
  return <PortalLeadership years={memberPastLeadership(doc, (id) => map.zones.find((z) => z.id === id)?.name ?? id)} />;
}
