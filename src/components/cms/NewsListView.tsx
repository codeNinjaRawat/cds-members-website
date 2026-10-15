/** News list view – admin: CMS › News. */
import Link from 'next/link';
import type { NewsItem } from '@/lib/content/pages';

export function NewsListView({ news }: { news: NewsItem[] }) {
  return (
    <article className="cms-page">
      <div className="wrap narrow">
        <header className="cms-head"><h1>News</h1><p className="intro">Updates from the Board, the Islamic Centers and the Election Commission.</p></header>
        <ul className="news-list">
          {news.map((n) => (
            <li key={n.slug}>
              <time dateTime={n.date}>{new Date(n.date + 'T12:00:00-05:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
              <h2><Link href={`/news/${n.slug}`}>{n.title}</Link></h2>
              <p>{n.excerpt}</p>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
