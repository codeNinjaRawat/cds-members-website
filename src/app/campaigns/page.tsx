import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CampaignsView } from '@/components/fundraising/CampaignsView';
import { getFundraising } from '@/lib/content/loaders';
import { mockGifts, mockPledges, publicCampaigns, type PublicCampaign } from '@/lib/community/fundraising';
import { apiConfig, apiGet } from '@/lib/api/client';

export const metadata: Metadata = { title: 'Campaigns', description: 'Fundraising campaigns: goals, progress, matching gifts and members’ personal fundraising pages.' };
type Props = { searchParams: Promise<{ c?: string; p?: string }> };

/** F8 public campaigns. Totals are computed on the server; no gift records reach the browser.
 *  Demo: the sample gifts · live: GET /public/campaigns (the API adds up the real gifts and pledges). */
export default async function CampaignsPage({ searchParams }: Props) {
  const [d, sp] = await Promise.all([getFundraising(), searchParams]);
  if (!d.website.enabled) notFound();
  let items: PublicCampaign[];
  if (apiConfig.useMock) items = publicCampaigns(d, mockGifts, mockPledges, new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }));
  else items = (await apiGet<{ enabled: boolean; campaigns: PublicCampaign[] }>('/public/campaigns', ['doc:fundraising'])).campaigns;
  return <CampaignsView items={items} selected={sp.c ?? ''} page={sp.p ?? ''} />;
}
