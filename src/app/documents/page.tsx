/** O9 – /documents: public records (annual reports, financials, bylaws, policies, public minutes) by category and year. Admin page `documents` replaces it. */
import type { Metadata } from 'next';
import { PageView } from '@/components/cms/PageView';
import { getPage, getRecords } from '@/lib/content/loaders';
import { RECORD_CATEGORIES, recordsFor, type RecordCategory } from '@/lib/community/records';
import { PageSchema, type Block } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Documents', description: 'Annual reports, financial statements, the Constitution and Bylaws, policies and public minutes.' };

export default async function DocumentsPage() {
  const custom = await getPage('documents');
  if (custom) return <PageView page={custom} />;
  const d = await getRecords();
  const items = d.website.enabled ? recordsFor(d, 'public').filter((r) => !r.archived).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const blocks: Block[] = [];
  for (const cat of Object.keys(RECORD_CATEGORIES) as RecordCategory[]) {
    const list = items.filter((r) => r.category === cat);
    if (!list.length) continue;
    blocks.push({ type: 'heading', text: RECORD_CATEGORIES[cat] }, { type: 'documents', items: list.map((r) => ({ title: r.title + (r.center ? ` – ${r.center}` : ''), href: r.url, kind: r.url.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Link', date: r.date })) });
  }
  if (!blocks.length) blocks.push({ type: 'callout', tone: 'info', title: 'Documents are being added', text: 'Annual reports, financial statements and policies will be listed here by year.' });
  blocks.push({ type: 'cta', title: 'Members see more', text: 'Meeting minutes and members-only records are in the member portal.', label: 'Sign in', href: '/sign-in?next=/portal/minutes' });
  const page = PageSchema.parse({ slug: 'documents', title: d.website.title || 'Documents', template: 'article', updatedAt: new Date().toISOString().slice(0, 10), intro: d.website.intro || 'Reports, statements, the Constitution and Bylaws and policies – the documents every member and neighbor may read.', blocks });
  return <PageView page={page} />;
}
