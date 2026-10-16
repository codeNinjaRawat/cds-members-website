import type { Metadata } from 'next';
import { getGiving, getHome, getJoinForm, getMembershipSettings, getOrgConfig } from '@/lib/content/loaders';
import { JoinPageView } from '@/components/join/JoinPageView';

export const metadata: Metadata = { title: 'Become a member', description: 'Join the Islamic Society of Greater Houston in about five minutes.' };

type Props = { searchParams: Promise<{ plan?: string; resume?: string }> };

/** Member sign-up (W4) – DEMO mode: runs fully in the browser, no API calls (owner request). */
export default async function JoinPage({ searchParams }: Props) {
  const [settings, home, giving, form, config, sp] = await Promise.all([getMembershipSettings(), getHome(), getGiving(), getJoinForm(), getOrgConfig(), searchParams]);
  return <JoinPageView settings={settings} form={form} initialPlan={sp.plan} images={home.joinImages ?? []} giving={giving} config={config} />;
}
