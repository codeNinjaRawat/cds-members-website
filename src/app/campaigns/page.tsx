import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CampaignsView } from '@/components/fundraising/CampaignsView';
import { getFundraising } from '@/lib/content/loaders';
import { mockGifts, mockPledges, publicCampaigns } from '@/lib/community/fundraising';

export const metadata: Metadata = { title: 'Campaigns', description: 'ISGH fundraising campaigns: goals, progress, matching gifts and members’ personal fundraising pages.' };
type Props = { searchParams: Promise<{ c?: string; p?: string }> };

/** F8 public campaigns. Totals are computed on the server; no gift records reach the browser.
 *  DEMO: gifts are the sample set; live: GET /public/campaigns returns these totals. */
export default async function CampaignsPage({ searchParams }: Props) {
  const [d, sp] = await Promise.all([getFundraising(), searchParams]);
  if (!d.website.enabled) notFound();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  return <CampaignsView items={publicCampaigns(d, mockGifts, mockPledges, today)} selected={sp.c ?? ''} page={sp.p ?? ''} />;
}
