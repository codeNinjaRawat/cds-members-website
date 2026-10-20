/** One news item (admin: CMS › News). A full article can be written as a CMS page at news/<slug>; otherwise the item's
 *  summary is shown. Rendered per visit – the news belongs to the organization at this address. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNews, getPage } from '@/lib/content/loaders';
import { PageView } from '@/components/cms/PageView';

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
        <div className="cms-body"><p>{item.excerpt}</p></div>
      </div>
    </article>
  );
}
