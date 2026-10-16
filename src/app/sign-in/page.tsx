import type { Metadata } from 'next';
import { SignInView } from '@/components/account/SignInView';
import { getOrgConfig, getOrgStructure, getSignIn } from '@/lib/content/loaders';
import { START_PATH } from '@/lib/community/org-config';

export const metadata: Metadata = { title: 'Sign in', description: 'Sign in to ISGH – your membership, and the dashboards of the roles you serve in.', robots: { index: false } };

/** W5 + M4 sign-in – DEMO (no API). Methods and dashboards follow Admin › Settings › Sign-in. */
export default async function SignInPage() {
  const [config, settings, org] = await Promise.all([getOrgConfig(), getSignIn(), getOrgStructure()]);
  // public parts only: masjid names, zones and service-area ZIP codes (for "Find your masjid")
  const masjids = org.centers.filter((c) => c.active).map((c) => ({ name: c.name, zone: org.zones.find((z) => z.id === c.zone)?.name ?? '', zips: c.zips, city: c.address.city }));
  return <SignInView startPath={START_PATH[config.startPage]} settings={settings} masjids={masjids} />;
}
