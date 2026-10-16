import type { Metadata } from 'next';
import { MemberHome } from '@/components/account/MemberHome';
import { getBenefits, getGroups, getOfficials, getOrgConfig, getOrgStructure } from '@/lib/content/loaders';
import { publicOfficials } from '@/lib/community/officials';
import { memberSafe } from '@/lib/community/benefits';

export const metadata: Metadata = { title: 'Member home', robots: { index: false } };

/** W5 member home – DEMO (session in this browser tab; live: session cookie + GET /member/me). Card and links follow Configuration. */
export default async function PortalPage() {
  const [config, groups, benefits, org, officials] = await Promise.all([getOrgConfig(), getGroups(), getBenefits(), getOrgStructure(), getOfficials()]);
  // M6 "My masjid": public parts only – masjid names and service-area ZIP codes, and the officials the website may show
  const masjids = org.centers.filter((c) => c.active).map((c) => ({ name: c.name, zone: org.zones.find((z) => z.id === c.zone)?.name ?? '', zips: c.zips, city: c.address.city, phone: c.phone }));
  return <MemberHome config={config} groups={groups} benefits={memberSafe(benefits)} masjids={masjids} leaders={publicOfficials(officials)} />;
}
