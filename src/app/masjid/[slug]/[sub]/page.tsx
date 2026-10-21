/** O3 – /masjid/<slug>/<route>: built-in route (prayer-times, jumuah, events, …) or an admin page at masjid/<slug>/<route>. */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageView } from '@/components/cms/PageView';
import { MasjidShell } from '@/components/masjid/MasjidShell';
import { MasjidGone } from '@/components/masjid/MasjidGone';
import { getNews, getOrgStructure, getPage, getPagesDoc } from '@/lib/content/loaders';
import { effectiveSeo, isLive } from '@/lib/content/page-rules';
import { builtInPage, isBuiltInRoute, masjidHref, masjidMenu, resolveMasjid, MASJID_ROUTES } from '@/lib/masjid/masjid-site';

export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ slug: string; sub: string }>; searchParams: Promise<{ preview?: string; kind?: string }> };

async function load(slug: string, sub: string, preview = false) {
  const map = await getOrgStructure();
  const r = resolveMasjid(map, slug);
  if (!r || !/^[a-z0-9-]{1,60}$/.test(sub)) return null;
  const [pages, custom, news] = await Promise.all([getPagesDoc(), getPage(`masjid/${r.slug}/${sub}`, { includeUnpublished: preview }), getNews(50)]);
  const page = custom ?? (isBuiltInRoute(sub) ? builtInPage(r, sub, news) : null);
  return { r, page, live: Object.values(pages).filter((p) => isLive(p)) };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, sub } = await params;
  const d = await load(slug, sub, true);
  if (!d?.page) return {};
  const seo = effectiveSeo(d.page);
  return { title: seo.title, description: seo.description || `${MASJID_ROUTES.find((x) => x.key === sub)?.label ?? sub} at ${d.r.center.name}`, robots: seo.noIndex ? { index: false } : undefined };
}

export default async function MasjidSubPage({ params, searchParams }: Params) {
  const [{ slug, sub }, sp] = await Promise.all([params, searchParams]);
  const preview = sp.preview === '1';
  const d = await load(slug, sub, preview);
  if (!d) notFound();
  if (!d.r.canonical) redirect(masjidHref(d.r.slug, sub));
  if (!d.r.center.active) return <MasjidGone name={d.r.center.name} />;
  if (!d.page) notFound();
  if (sub === 'activity' && sp.kind) d.page = { ...d.page, blocks: d.page.blocks.map((b) => (b.type === 'activity' ? { ...b, kinds: [sp.kind!] } : b)) }; // ?kind= filter on the built-in activity route
  return <MasjidShell r={d.r} menu={masjidMenu(d.r, d.live)} current={sub}><PageView page={d.page} preview={preview} /></MasjidShell>;
}
