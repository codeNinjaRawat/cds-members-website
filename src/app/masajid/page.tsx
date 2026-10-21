/** O3/O5 – /masajid: the network directory (every active masjid by zone). An admin page at `masajid` replaces it. */
import type { Metadata } from 'next';
import { PageView } from '@/components/cms/PageView';
import { getOrgStructure, getPage } from '@/lib/content/loaders';
import { getSiteConfig } from '@/lib/site-config/get-site-config';
import { PageSchema, type Block } from '@/lib/content/pages';
import { homeForZip } from '@/lib/community/org-structure';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Masajid', description: 'Every masjid in the network by zone: addresses, Jumuah times, services and each masjid’s own pages.' };

type Props = { searchParams: Promise<{ zip?: string }> };

export default async function MasajidPage({ searchParams }: Props) {
  const zip = ((await searchParams).zip ?? '').replace(/\D/g, '').slice(0, 5);
  const custom = await getPage('masajid');
  if (custom) return <PageView page={custom} />;
  const [map, site] = await Promise.all([getOrgStructure(), getSiteConfig()]);
  const zones = map.zones.filter((z) => z.active);
  const found = zip.length === 5 ? homeForZip(map, zip) : null;
  const blocks: Block[] = [
    { type: 'form', kind: 'feedback' }, // placeholder replaced below
    { type: 'facts', items: [{ value: String(map.centers.filter((c) => c.active).length), label: 'Masajid' }, { value: String(zones.length), label: 'Zones' }, { value: String(map.centers.filter((c) => c.active && c.jumuah.length).length), label: 'With Jumuah' }] },
    ...zones.flatMap((z): Block[] => [{ type: 'heading', text: z.name }, { type: 'masjid-cards', zone: z.id }]),
    { type: 'cta', title: 'Which masjid is mine?', text: 'Your home address decides your zone and masjid. Members see theirs after signing in.', label: 'Sign in', href: '/sign-in?next=/portal' },
  ];
  // O5.1 find my masjid by ZIP (same placement rule as membership: ZIP → masjid → zone)
  blocks[0] = found
    ? (found.center ? { type: 'callout', tone: 'success', title: `ZIP ${zip}: ${found.center.name}`, text: `${found.zone?.name ?? ''} – ${found.why} [Open ${found.center.name}](/masjid/${found.center.id})` } : { type: 'callout', tone: 'info', title: `ZIP ${zip}`, text: found.why || 'This ZIP code is not inside a masjid service area yet – choose the nearest masjid below or contact the office.' })
    : { type: 'paragraph', text: 'Which masjid is mine? Add your ZIP code to the address, for example [/masajid?zip=77036](/masajid?zip=77036), or sign in – members see their masjid on the member home.' };
  const page = PageSchema.parse({ slug: 'masajid', title: `Masajid of ${site.org.shortName}`, template: 'hub', updatedAt: new Date().toISOString().slice(0, 10), intro: 'Every masjid has its own pages: prayer times, Jumuah, events, programs, announcements, leadership and giving.', blocks });
  return <PageView page={page} />;
}
