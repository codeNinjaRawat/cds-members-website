/** O4 – /activity: everything happening across the network. An admin page at `activity` replaces it. */
import type { Metadata } from 'next';
import { PageView } from '@/components/cms/PageView';
import { getPage } from '@/lib/content/loaders';
import { PageSchema } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Activity', description: 'Events, announcements, campaigns, leadership changes, prayer-time changes and documents across every masjid – one stream.' };
type Props = { searchParams: Promise<{ kind?: string }> };

export default async function ActivityPage({ searchParams }: Props) {
  const { kind } = await searchParams;
  const custom = await getPage('activity');
  if (custom) return <PageView page={custom} />;
  const page = PageSchema.parse({ slug: 'activity', title: 'What’s happening', template: 'hub', updatedAt: new Date().toISOString().slice(0, 10), intro: 'Across every masjid: events, announcements, campaigns, new leaders, prayer-time changes and published documents.', blocks: [
    { type: 'activity', masjid: '', view: 'feed', kinds: kind ? [kind] : [], limit: 100 },
    { type: 'buttons', items: [{ label: 'RSS feed', href: '/activity/feed', style: 'ghost' }] },
  ] });
  return <PageView page={page} />;
}
