import type { Metadata } from 'next';
import { getOrgStructure, getRecords } from '@/lib/content/loaders';
import { recordsFor } from '@/lib/community/records';
import { PortalRecords } from '@/components/account/PortalWork';

export const metadata: Metadata = { title: 'Records library', robots: { index: false } };

/** Member portal › Records library (R1). Public + members-only records; leaders-only ones never reach the browser. Live: GET /member/records. */
export default async function Page() {
  const [d, map] = await Promise.all([getRecords(), getOrgStructure()]);
  return <PortalRecords items={recordsFor(d, 'members')} centerOrder={map.centers.map((c) => c.name)} />;
}
