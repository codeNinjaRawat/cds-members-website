/** O3 – /masjid/<slug>: the masjid overview (built-in page, or the admin page at masjid/<slug>). */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageView } from '@/components/cms/PageView';
import { MasjidShell } from '@/components/masjid/MasjidShell';
import { MasjidGone } from '@/components/masjid/MasjidGone';
import { getNews, getOrgStructure, getPage, getPagesDoc } from '@/lib/content/loaders';
import { isLive } from '@/lib/content/page-rules';
import { builtInPage, masjidHref, masjidMenu, resolveMasjid } from '@/lib/masjid/masjid-site';

export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = resolveMasjid(await getOrgStructure(), (await params).slug);
  if (!r) return {};
  const c = r.center;
  return { title: c.name, description: c.profile.story || `${c.name}${c.aka ? ` (${c.aka})` : ''} – prayer times, Jumuah, events, programs and how to give.`, openGraph: c.profile.photo ? { images: [{ url: c.profile.photo.src, alt: c.profile.photo.alt }] } : undefined };
}

export default async function MasjidPage({ params }: Params) {
  const { slug } = await params;
  const map = await getOrgStructure();
  const r = resolveMasjid(map, slug);
  if (!r) notFound();
  if (!r.canonical) redirect(masjidHref(r.slug));
  if (!r.center.active) return <MasjidGone name={r.center.name} />;
  const [pages, custom, news] = await Promise.all([getPagesDoc(), getPage(`masjid/${r.slug}`), getNews(50)]);
  const live = Object.values(pages).filter((p) => isLive(p));
  const page = custom ?? builtInPage(r, '', news);
  return <MasjidShell r={r} menu={masjidMenu(r, live)} current=""><PageView page={page} /></MasjidShell>;
}
