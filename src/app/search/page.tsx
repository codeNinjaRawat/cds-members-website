/** O2.2 – /search: one box for everything admins publish (pages, masajid, news, events, campaigns, documents). */
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSearchDocs } from '@/lib/content/loaders';
import { grouped, search } from '@/lib/search/search';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Search', robots: { index: false } };
type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? '').slice(0, 100).trim();
  const hits = q ? search(await getSearchDocs(), q) : [];
  const groups = grouped(hits);
  return (
    <article className="cms-page"><div className="wrap narrow">
      <header className="cms-head"><h1>Search</h1><p className="intro">Pages, masajid, news, events, campaigns and documents.</p></header>
      <form className="search-form" action="/search" role="search">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Try “prayer times”, a masjid name, “zakat”…" autoFocus={!q} maxLength={100} />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>
      {q && !hits.length && <p className="blk-empty" role="status">Nothing found for “{q}”. Try another word, or browse <Link href="/masajid">masajid</Link> and <Link href="/events">events</Link>.</p>}
      {q && hits.length > 0 && <p className="search-count" role="status">{hits.length} result{hits.length === 1 ? '' : 's'} for “{q}”</p>}
      {groups.map((g) => (
        <section key={g.kind} className="search-group">
          <h2>{g.label}</h2>
          <ul className="search-list">{g.hits.map((h) => (
            <li key={h.href}><Link href={h.href} className="search-hit"><b>{h.title}</b><span>{h.snippet}</span><small>{h.href}</small></Link></li>
          ))}</ul>
        </section>
      ))}
    </div></article>
  );
}
