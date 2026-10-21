/** O4 – /masjid/<slug>/feed: RSS of one masjid's activity (its own + organization-wide items). */
import { forMasjid, toRss } from '@/lib/activity/activity';
import { getActivity, getOrgStructure } from '@/lib/content/loaders';
import { resolveMasjid } from '@/lib/masjid/masjid-site';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const r = resolveMasjid(await getOrgStructure(), slug);
  if (!r || !r.center.active) return new Response('Not found', { status: 404 });
  const origin = new URL(req.url).origin;
  const items = forMasjid(await getActivity(), r.slug).filter((a) => a.tense === 'past');
  const xml = toRss(items, { title: `${r.center.name} – activity`, link: `${origin}/masjid/${r.slug}/activity`, description: `What is happening at ${r.center.name}.` });
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
