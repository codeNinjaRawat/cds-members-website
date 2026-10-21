/** O10 – /elections/<year>: one election (archive or current). The hub is the admin page `elections` (with the election block). */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageView } from '@/components/cms/PageView';
import { getPage, getPublicElection } from '@/lib/content/loaders';
import { PageSchema } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ year: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { year } = await params;
  return { title: `${year} election`, description: `Dates, seats, candidates and results of the ${year} election.` };
}

export default async function ElectionYearPage({ params }: Params) {
  const { year } = await params;
  if (!/^\d{4}$/.test(year)) notFound();
  const custom = await getPage(`elections/${year}`);
  if (custom) return <PageView page={custom} />;
  const e = await getPublicElection(Number(year));
  if (!e || e.year !== Number(year)) notFound();
  const page = PageSchema.parse({ slug: `elections/${year}`, title: `${year} election`, template: 'hub', updatedAt: new Date().toISOString().slice(0, 10), blocks: [
    { type: 'election', year: Number(year) },
    { type: 'buttons', items: [{ label: 'About elections', href: '/elections', style: 'secondary' }, { label: 'Leadership', href: '/leadership', style: 'ghost' }] },
  ] });
  return <PageView page={page} />;
}
