/** One news item (admin: CMS › News). A full article can be written as a CMS page at news/<slug>; otherwise the item's
 *  summary is shown. Rendered per visit – the news belongs to the organization at this address. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNews, getPage } from '@/lib/content/loaders';
import { PageView } from '@/components/cms/PageView';
import { Photo } from '@/components/ui/Photo';

export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ slug: string }> };
const find = async (slug: string) => (await getNews(200)).find((n) => n.slug === slug) ?? null;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const n = await find((await params).slug);
  return n ? { title: n.title, description: n.excerpt } : {};
}

export default async function NewsItemPage({ params }: Params) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const [item, article] = await Promise.all([find(slug), getPage(`news/${slug}`)]);
  if (article) return <PageView page={article} />;
  if (!item) notFound();
  return (
    <article className="cms-page">
      <div className="wrap narrow">
        <header className="cms-head">
          <p><Link href="/news">← All news</Link></p>
          <h1>{item.title}</h1>
          <p className="intro"><time dateTime={item.date}>{new Date(item.date + 'T12:00:00-05:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time></p>
        </header>
        <div className="cms-body">
          <p>{item.excerpt}</p>
          {item.image && <Photo image={item.image} sizes="(max-width: 800px) 100vw, 760px" className="cms-hero-img" showCredit />}
          {item.attachments.length > 0 && <ul className="blk-docs">{item.attachments.map((a) => <li key={a.href}><a className="blk-doc" href={a.href} rel="noopener" target="_blank"><span className="blk-doc-kind" aria-hidden>{a.href.toLowerCase().endsWith('.pdf') ? 'PDF' : 'LINK'}</span><span className="blk-doc-title">{a.title}</span><span className="blk-doc-meta">Attachment</span></a></li>)}</ul>}
        </div>
      </div>
    </article>
  );
}
