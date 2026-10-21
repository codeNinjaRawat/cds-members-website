/** O3.6 – /masjid/<slug>/screen: lobby / digital-signage view. Same data as the website, no header or footer,
 *  readable from across a hall, refreshes itself every five minutes. */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEvents, getNews, getOrgStructure, getPrayerTimes } from '@/lib/content/loaders';
import { resolveMasjid } from '@/lib/masjid/masjid-site';
import { PRAYERS, PRAYER_NAME, clock, dayTimes, nextPrayer, type IqPrayer } from '@/lib/community/prayer';
import { fmtTime } from '@/lib/community/org-structure';
import { fmtRange, publicEvents, upcoming } from '@/lib/community/events';
import { AutoRefresh } from '@/components/masjid/AutoRefresh';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Lobby screen', robots: { index: false } };
type Params = { params: Promise<{ slug: string }> };
const todayCT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const nowMinCT = () => { const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date()); return Number(p.find((x) => x.type === 'hour')?.value) * 60 + Number(p.find((x) => x.type === 'minute')?.value); };

export default async function ScreenPage({ params }: Params) {
  const { slug } = await params;
  const [map, s, ev, news] = await Promise.all([getOrgStructure(), getPrayerTimes(), getEvents(), getNews(20)]);
  const r = resolveMasjid(map, slug);
  if (!r || !r.center.active) notFound();
  const c = r.center; const today = todayCT();
  const d = dayTimes(s, c.name, today, c.jumuah.map((j) => j.khutbah));
  const next = nextPrayer(d, nowMinCT());
  const events = ev.enabled ? upcoming(publicEvents(ev), new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 16)).filter((e) => e.visibility === 'public' && (!e.location.center || e.location.center === c.name || e.location.center === c.id)).slice(0, 4) : [];
  const notes = news.filter((n) => n.masjid === c.id || (!n.masjid && n.showOnMasjids)).slice(0, 3);
  return (
    <main className="screen" data-accent={c.profile.accent}>
      <AutoRefresh seconds={300} />
      <header className="screen-head">
        <div><h1>{c.name}</h1><p>{new Date(`${today}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}{s.website.showHijri ? ` · ${d.hijri}` : ''}</p></div>
        <p className="screen-next">{next ? <><span>Next</span><b>{PRAYER_NAME[next.prayer]}</b><strong>{clock(next.at)}</strong></> : <b>All prayers done for today</b>}</p>
      </header>
      <section className="screen-times" aria-label="Prayer times">
        <div className="screen-row screen-row-head"><span /><span>Adhan</span><span>Iqamah</span></div>
        {PRAYERS.map((p) => (
          <div key={p} className="screen-row" data-next={next?.prayer === p || undefined}>
            <span>{PRAYER_NAME[p]}</span><span>{clock(d.adhan[p])}</span><span>{p === 'sunrise' || !d.iqamah ? '—' : clock(d.iqamah[p as IqPrayer])}</span>
          </div>
        ))}
        {c.jumuah.length > 0 && <div className="screen-row screen-jumuah"><span>Jumuah</span><span>{c.jumuah.map((j) => fmtTime(j.khutbah)).join(' · ')}</span><span>Friday</span></div>}
      </section>
      <aside className="screen-side">
        {events.length > 0 && <section><h2>Coming up</h2><ul>{events.map((e) => <li key={e.id}><b>{e.title}</b><span>{fmtRange(e)}</span></li>)}</ul></section>}
        {notes.length > 0 && <section><h2>Announcements</h2><ul>{notes.map((n) => <li key={n.slug}><b>{n.title}</b><span>{n.excerpt}</span></li>)}</ul></section>}
        {d.special.length > 0 && <section><h2>Today</h2><ul>{d.special.map((x) => <li key={x.id}><b>{x.name}</b><span>{x.times.map((t) => fmtTime(t)).join(' · ')}{x.place ? ` · ${x.place}` : ''}</span></li>)}</ul></section>}
      </aside>
      <footer className="screen-foot">{map.zones.find((z) => z.id === c.zone)?.name} · {c.phone}</footer>
    </main>
  );
}
