import type { Metadata } from 'next';
import { getSiteConfig } from '@/lib/site-config/get-site-config';
import { getGiving, getJoinForm, getMembershipSettings, getOrgConfig } from '@/lib/content/loaders';
import { JoinPageView } from '@/components/join/JoinPageView';

export async function generateMetadata(): Promise<Metadata> {
  const { org } = await getSiteConfig();
  return { title: 'Become a member', description: `Join ${org.name} in about five minutes.` };
}

type Props = { searchParams: Promise<{ plan?: string; resume?: string }> };

/** Member sign-up (W4) – DEMO mode: runs fully in the browser, no API calls (owner request). */
export default async function JoinPage({ searchParams }: Props) {
  const [settings, giving, form, config, site, sp] = await Promise.all([getMembershipSettings(), getGiving(), getJoinForm(), getOrgConfig(), getSiteConfig(), searchParams]);
  return <JoinPageView settings={settings} form={form} initialPlan={sp.plan} giving={giving} config={config} org={{ name: site.org.name, shortName: site.org.shortName }} />;
}
