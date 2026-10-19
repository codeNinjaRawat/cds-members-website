/** R1 Records (public): the organization's public documents, then each masjid's. Members-only records live in the member portal. */
import { RECORD_CATEGORIES, fmtDate, recordsByCenter, type RecordItem } from '@/lib/community/records';

export function RecordsPageView({ title, intro, items, centerOrder, signedIn = false }: { title: string; intro: string; items: RecordItem[]; centerOrder: string[]; signedIn?: boolean }) {
  const groups = recordsByCenter(items, centerOrder);
  return (
    <article className="cms-page records">
      <div className="wrap">
        <header className="cms-head narrow-head"><p className="eyebrow">Documents</p><h1>{title}</h1><p className="intro">{intro}{!signedIn && ' Members see more after signing in.'}</p></header>
        {!groups.length && <p className="muted">Nothing published yet.</p>}
        {groups.map((g) => (
          <section key={g.center || 'org'} className="rec-group" aria-labelledby={`rec-${g.center || 'org'}`} data-center={g.center}>
            <h2 id={`rec-${g.center || 'org'}`}>{g.label}</h2>
            <ul className="rec-list">{g.items.map((r) => (
              <li key={r.id}><a href={r.url} target={r.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer"><b>{r.title}</b></a><span className="rec-meta">{RECORD_CATEGORIES[r.category]} · {fmtDate(r.date)}</span>{r.summary && <p>{r.summary}</p>}</li>
            ))}</ul>
          </section>
        ))}
      </div>
    </article>
  );
}
