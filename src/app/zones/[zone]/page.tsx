/** O3/O5 – /zones/<zone>: a zone's director, masajid and leaders. An admin page at `zones/<zone>` replaces it. */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageView } from '@/components/cms/PageView';
import { getOrgStructure, getPage } from '@/lib/content/loaders';
import { PageSchema, type Block } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ zone: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { zone } = await params;
  const z = (await getOrgStructure()).zones.find((x) => x.id === zone && x.active);
  return z ? { title: z.name, description: `${z.name}: its masajid, Zonal Director and leaders.` } : {};
}

export default async function ZonePage({ params }: Params) {
  const { zone } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(zone)) notFound();
  const [map, custom] = await Promise.all([getOrgStructure(), getPage(`zones/${zone}`)]);
  if (custom) return <PageView page={custom} />;
  const z = map.zones.find((x) => x.id === zone && x.active);
  if (!z) notFound();
  const centers = map.centers.filter((c) => c.active && c.zone === z.id);
  const blocks: Block[] = [
    { type: 'facts', items: [{ value: String(centers.length), label: 'Masajid' }, { value: String(z.zips.length), label: 'ZIP codes' }, ...(z.director.name ? [{ value: z.director.name, label: 'Zonal Director' }] : [])] },
    ...(z.areas ? [{ type: 'paragraph' as const, text: `Areas: ${z.areas}.` }] : []),
    { type: 'heading', text: 'Masajid in this zone' }, { type: 'masjid-cards', zone: z.id },
    { type: 'heading', text: 'Leadership' }, { type: 'leadership', scope: 'zone', masjid: '', zone: z.id },
    ...(z.director.email ? [{ type: 'contact' as const, lines: [{ label: 'Zone office', value: z.director.email, href: `mailto:${z.director.email}` }] }] : []),
    { type: 'buttons', items: [{ label: 'All masajid', href: '/masajid', style: 'secondary' }, { label: 'All leaders', href: '/leadership', style: 'ghost' }] },
  ];
  return <PageView page={PageSchema.parse({ slug: `zones/${z.id}`, title: z.name, template: 'hub', updatedAt: new Date().toISOString().slice(0, 10), blocks })} />;
}
