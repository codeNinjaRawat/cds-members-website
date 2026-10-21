/** O6 – `khutbah` live block: the Friday schedule for one masjid (coming Fridays) or for all masajid (next Friday). */
import Link from 'next/link';
import { getOrgStructure, getPrayerTimes } from '@/lib/content/loaders';
import { blockMasjid } from '@/lib/content/page-rules';
import type { LiveBlock, Page } from '@/lib/content/pages';
import { fmtTime } from '@/lib/community/org-structure';
import { khutbahFor, nextFriday } from '@/lib/community/prayer';

const todayCT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const dayName = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export async function KhutbahBlockView({ b, page }: { b: Extract<LiveBlock, { type: 'khutbah' }>; page: Page }) {
  const [s, map] = await Promise.all([getPrayerTimes(), getOrgStructure()]);
  if (!s.khutbah.enabled) return null;
  const ref = blockMasjid(b, page);
  const center = ref ? map.centers.find((c) => c.id === ref || c.name === ref) : null;
  const today = todayCT(); const friday = nextFriday(today);
  if (center) {
    const rows = khutbahFor(s.khutbah, { center: center.name, from: today, weeks: b.weeks });
    if (!rows.length) return <p className="blk-empty">The khutbah schedule for the coming weeks will be posted here.</p>;
    return (
      <div className="kh">
        {s.khutbah.note && <p className="kh-note">{s.khutbah.note}</p>}
        <ol className="kh-list">{rows.map((r, i) => (
          <li key={i} className="kh-row" data-today={r.date === friday ? 'true' : undefined}>
            <span className="kh-date"><b>{r.date.slice(8, 10)}</b><span>{new Date(`${r.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span></span>
            <span className="kh-body"><b>{r.khateeb || 'Khateeb to be announced'}</b>{r.topic && <span>{r.topic}</span>}<span className="kh-meta">{[r.time ? fmtTime(r.time) : center.jumuah[0] ? fmtTime(center.jumuah[0].khutbah) : '', r.language, r.note].filter(Boolean).join(' · ')}</span></span>
          </li>
        ))}</ol>
        {s.khutbah.feedbackUrl && <p className="kh-more"><Link href={s.khutbah.feedbackUrl}>Rate a khutbah →</Link> · <Link href="/khutbah">All masajid →</Link></p>}
      </div>
    );
  }
  const rows = khutbahFor(s.khutbah, { date: friday });
  if (!rows.length) return <p className="blk-empty">No khutbah schedule posted for {dayName(friday)} yet.</p>;
  const byZone = map.zones.filter((z) => z.active).map((z) => ({ zone: z, rows: rows.filter((r) => map.centers.find((c) => c.name === r.center)?.zone === z.id) })).filter((g) => g.rows.length);
  const orphans = rows.filter((r) => !map.centers.some((c) => c.name === r.center));
  return (
    <div className="kh">
      <p className="kh-when">{dayName(friday)}{s.khutbah.note ? ` · ${s.khutbah.note}` : ''}</p>
      {[...byZone.map((g) => ({ label: g.zone.name, rows: g.rows })), ...(orphans.length ? [{ label: 'Other', rows: orphans }] : [])].map((g) => (
        <section key={g.label} className="kh-zone"><h3>{g.label}</h3>
          <div className="blk-table-wrap"><table className="blk-table kh-table"><thead><tr><th scope="col">Masjid</th><th scope="col">Time</th><th scope="col">Khateeb</th><th scope="col">Topic</th><th scope="col">Language</th></tr></thead>
            <tbody>{g.rows.map((r, i) => { const c = map.centers.find((x) => x.name === r.center); return (
              <tr key={i}><th scope="row">{c ? <Link href={`/masjid/${c.id}/jumuah`}>{r.center}</Link> : r.center}</th><td>{r.time ? fmtTime(r.time) : c?.jumuah[0] ? fmtTime(c.jumuah[0].khutbah) : '—'}</td><td>{r.khateeb || 'TBA'}</td><td>{r.topic}{r.note ? <small>{r.note}</small> : null}</td><td>{r.language}</td></tr>); })}</tbody></table></div>
        </section>
      ))}
    </div>
  );
}
