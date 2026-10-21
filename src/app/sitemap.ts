/** O2.5 – /sitemap.xml from admin content: live public pages, masajid routes, zones, events, news, campaigns. */
import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getEvents, getFundraising, getNews, getOrgStructure, getPagesDoc } from '@/lib/content/loaders';
import { isLive } from '@/lib/content/page-rules';
import { MASJID_ROUTES } from '@/lib/masjid/masjid-site';
import { publicEvents } from '@/lib/community/events';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.ISGH_NOINDEX === 'true') return [];
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host') ?? 'localhost:3000'}`;
  const [pages, map, events, news, fundraising] = await Promise.all([getPagesDoc(), getOrgStructure(), getEvents(), getNews(200), getFundraising()]);
  const u = (path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({ url: `${origin}${path}`, lastModified: lastModified ? new Date(`${lastModified.slice(0, 10)}T12:00:00Z`) : undefined, priority });
  const out: MetadataRoute.Sitemap = [u('/', undefined, 1), u('/membership', undefined, .9), u('/masajid', undefined, .9), u('/prayer-times', undefined, .9), u('/events', undefined, .8), u('/give', undefined, .8), u('/news', undefined, .7), u('/leadership', undefined, .6), u('/activity', undefined, .6)];
  for (const p of Object.values(pages)) if (p.visibility === 'public' && isLive(p) && !p.seo.noIndex) out.push(u(`/${p.slug}`, p.updatedAt));
  for (const z of map.zones.filter((z) => z.active)) out.push(u(`/zones/${z.id}`));
  for (const c of map.centers.filter((c) => c.active)) for (const r of MASJID_ROUTES) if (r.key !== 'gallery' || c.profile.gallery.length) out.push(u(`/masjid/${c.id}${r.key ? `/${r.key}` : ''}`, undefined, r.key ? .5 : .8));
  if (events.enabled) for (const e of publicEvents(events).events) if (e.visibility === 'public') out.push(u(`/events/${e.id}`, e.start, .5));
  for (const n of news) out.push(u(`/news/${n.slug}`, n.date, .5));
  if (fundraising.website.enabled) for (const c of fundraising.campaigns) if (c.status !== 'draft') out.push(u(`/campaigns?c=${c.id}`, c.start, .5));
  const seen = new Set<string>();
  return out.filter((x) => !seen.has(x.url) && seen.add(x.url));
}
