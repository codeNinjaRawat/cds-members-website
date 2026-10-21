/** O4 – /activity/feed: RSS of the organization's activity (public items only). */
import { getActivity } from '@/lib/content/loaders';
import { getSiteConfig } from '@/lib/site-config/get-site-config';
import { toRss } from '@/lib/activity/activity';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const [items, site] = await Promise.all([getActivity(), getSiteConfig()]);
  const origin = new URL(req.url).origin;
  const xml = toRss(items.filter((a) => a.tense === 'past'), { title: `${site.org.shortName} – activity`, link: `${origin}/activity`, description: 'Events, announcements, campaigns, leadership and documents across the network.' });
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
