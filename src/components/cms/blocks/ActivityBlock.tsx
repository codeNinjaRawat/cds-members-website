/** O4 – the `activity` live block: "this week" digest or the full feed with kind filters (links, not a client app). */
import Link from 'next/link';
import { ACTIVITY_KINDS, byKind, forMasjid, KIND_LABEL, thisWeek, type Activity, type ActivityKind } from '@/lib/activity/activity';
import { getActivity } from '@/lib/content/loaders';
import { blockMasjid } from '@/lib/content/page-rules';
import type { LiveBlock, Page } from '@/lib/content/pages';

const todayCT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const when = (a: Activity, today: string) => {
  const d = a.at.slice(0, 10); const t = a.at.length > 10 ? ` · ${(() => { const [h, m] = a.at.slice(11, 16).split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; })()}` : '';
  if (d === today) return `Today${t}`;
  const diff = Math.round((Date.parse(`${d}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
  if (diff === 1) return `Tomorrow${t}`; if (diff === -1) return `Yesterday${t}`;
  return new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }) + t;
};

function Item({ a, today, showMasjid }: { a: Activity; today: string; showMasjid: boolean }) {
  return (
    <li className="act-item" data-kind={a.kind}>
      <Link href={a.href} className="act-a">
        <span className="act-kind">{KIND_LABEL[a.kind]}</span>
        <b>{a.title}</b>
        {a.summary && <span className="act-summary">{a.summary}</span>}
        <span className="act-meta">{when(a, today)}{showMasjid && a.masjidName ? ` · ${a.masjidName}` : showMasjid && !a.masjid ? ' · Organization' : ''}</span>
      </Link>
    </li>
  );
}

export async function ActivityBlockView({ b, page, filterKinds = [] }: { b: Extract<LiveBlock, { type: 'activity' }>; page: Page; filterKinds?: string[] }) {
  const today = todayCT();
  const masjid = blockMasjid(b, page);
  const kinds = (filterKinds.length ? filterKinds : b.kinds).filter((k): k is ActivityKind => (ACTIVITY_KINDS as readonly string[]).includes(k));
  const mine = forMasjid(await getActivity(), masjid);
  const all = byKind(mine, kinds);
  const showMasjid = !masjid;
  if (b.view === 'week') {
    const w = thisWeek(all, today);
    if (!w.upcoming.length && !w.recent.length) return <p className="blk-empty">Nothing new this week.</p>;
    return (
      <div className="act-week">
        {w.upcoming.length > 0 && <section><h3>Coming up</h3><ul className="act-list">{w.upcoming.slice(0, b.limit).map((a) => <Item key={a.id} a={a} today={today} showMasjid={showMasjid} />)}</ul></section>}
        {w.recent.length > 0 && <section><h3>Recently</h3><ul className="act-list">{w.recent.slice(0, b.limit).map((a) => <Item key={a.id} a={a} today={today} showMasjid={showMasjid} />)}</ul></section>}
        {masjid && <p className="act-more"><Link href={`/masjid/${masjid}/activity`}>All activity →</Link></p>}
      </div>
    );
  }
  const base = masjid ? `/masjid/${masjid}/activity` : '/activity';
  const present = ACTIVITY_KINDS.filter((k) => mine.some((a) => a.kind === k));
  return (
    <div className="act-feed">
      <nav className="act-filters" aria-label="Filter activity">
        <Link href={base} aria-current={!kinds.length ? 'page' : undefined}>All</Link>
        {present.map((k) => <Link key={k} href={`${base}?kind=${k}`} aria-current={kinds.length === 1 && kinds[0] === k ? 'page' : undefined}>{KIND_LABEL[k]}</Link>)}
      </nav>
      {!all.length ? <p className="blk-empty">No activity to show.</p> : <ul className="act-list">{all.slice(0, b.limit).map((a) => <Item key={a.id} a={a} today={today} showMasjid={showMasjid} />)}</ul>}
    </div>
  );
}
