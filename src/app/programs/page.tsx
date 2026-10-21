/** O7 – /programs: classes, schools, halaqas, youth and sisters' programs across the network (events of those categories),
 *  filterable by masjid (?masjid=<id>). An admin page `programs` replaces it. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageView } from '@/components/cms/PageView';
import { getOrgStructure, getPage } from '@/lib/content/loaders';
import { PageSchema, type Block } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Programs', description: 'Classes, weekend schools, halaqas, youth and sisters’ programs at every masjid.' };
type Props = { searchParams: Promise<{ masjid?: string }> };

export default async function ProgramsPage({ searchParams }: Props) {
  const { masjid = '' } = await searchParams;
  const custom = await getPage('programs');
  if (custom) return <PageView page={custom} />;
  const map = await getOrgStructure();
  const centers = map.centers.filter((c) => c.active);
  const sel = centers.find((c) => c.id === masjid) ?? null;
  const m = sel?.id ?? '';
  const blocks: Block[] = [
    { type: 'heading', text: 'Classes and education' }, { type: 'events', masjid: m, category: 'education', limit: 12, emptyText: 'No classes listed right now.' },
    { type: 'heading', text: 'Youth' }, { type: 'events', masjid: m, category: 'youth', limit: 8, emptyText: 'No youth programs listed right now.' },
    { type: 'heading', text: 'Sisters' }, { type: 'events', masjid: m, category: 'sisters', limit: 8, emptyText: 'No sisters’ programs listed right now.' },
    { type: 'heading', text: 'Community' }, { type: 'events', masjid: m, category: 'community', limit: 8, emptyText: '' },
    { type: 'cta', title: 'Run a program at your masjid?', text: 'Programs are published by the office and masjid teams through the events module – registration, capacity and reminders included.', label: 'Contact us', href: '/contact' },
  ];
  const page = PageSchema.parse({ slug: 'programs', title: sel ? `Programs · ${sel.name}` : 'Programs', template: 'hub', updatedAt: new Date().toISOString().slice(0, 10), intro: 'Classes, weekend schools, halaqas, youth and sisters’ programs. Pick a masjid or browse the whole network.', blocks });
  return (
    <>
      <div className="wrap programs-filter">
        <nav className="act-filters" aria-label="Filter by masjid">
          <Link href="/programs" aria-current={!m ? 'page' : undefined}>All masajid</Link>
          {centers.map((c) => <Link key={c.id} href={`/programs?masjid=${c.id}`} aria-current={c.id === m ? 'page' : undefined}>{c.name}</Link>)}
        </nav>
      </div>
      <PageView page={page} />
    </>
  );
}
