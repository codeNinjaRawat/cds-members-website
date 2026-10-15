import type { Metadata } from 'next';
import { getGiving, getHome, getJoinForm, getMembershipSettings } from '@/lib/content/loaders';
import { JoinPageView } from '@/components/join/JoinPageView';

export const metadata: Metadata = { title: 'Become a member', description: 'Join the Islamic Society of Greater Houston in about five minutes.' };

type Props = { searchParams: Promise<{ plan?: string; resume?: string }> };

/** Member sign-up (W4) – DEMO mode: runs fully in the browser, no API calls (owner request). */
export default async function JoinPage({ searchParams }: Props) {
  const [settings, home, giving, form, sp] = await Promise.all([getMembershipSettings(), getHome(), getGiving(), getJoinForm(), searchParams]);
  return <JoinPageView settings={settings} form={form} initialPlan={sp.plan} images={home.joinImages ?? []} giving={giving} />;
}
