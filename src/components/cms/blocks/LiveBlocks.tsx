/**
 * O1 live blocks – admins only say WHAT to show; the data comes from the admin modules and is rendered on the
 * server (nothing private reaches the browser). A block renders nothing when its module is off or empty,
 * unless the admin gave it an `emptyText`.
 */
import Link from 'next/link';
import { apiConfig, apiGet } from '@/lib/api/client';
import { getEvents, getFundraising, getMembershipSettings, getNews, getOfficials, getOrgStructure, getPrayerTimes } from '@/lib/content/loaders';
import { blockMasjid } from '@/lib/content/page-rules';
import type { LiveBlock, Page } from '@/lib/content/pages';
import { formatUSD } from '@/lib/content/membership';
import { CATEGORY_LABEL, fmtRange, publicEvents, upcoming } from '@/lib/community/events';
import { mockGifts, mockPledges, publicCampaigns, usd, type PublicCampaign } from '@/lib/community/fundraising';
import { publicOfficials } from '@/lib/community/officials';
import { SERVICE_LABEL, fmtTime, slugify, type Center } from '@/lib/community/org-structure';
import { IQAMAH_PRAYERS, PRAYERS, PRAYER_NAME, clock, dayTimes, monthDays, nextPrayer } from '@/lib/community/prayer';
import { FeedbackForm } from '@/components/forms/FeedbackForm';
import { ComplaintForm } from '@/components/forms/ComplaintForm';
import { VerifyForm } from '@/components/forms/VerifyForm';

const todayCT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
const nowMinCT = () => { const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date()); return Number(p.find((x) => x.type === 'hour')?.value) * 60 + Number(p.find((x) => x.type === 'minute')?.value); };
const houstonNowMin = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 16);
const dayName = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });

/** A masjid by id, or by name/slug (events, campaigns and prayer settings name the center). */
async function findCenter(ref: string): Promise<Center | null> {
  if (!ref) return null;
  const map = await getOrgStructure();
  return map.centers.find((c) => c.id === ref || c.name === ref || slugify(c.name) === ref) ?? null;
}
const sameCenter = (name: string | undefined, c: Center | null) => !c || !name || name === c.name || name === c.id || slugify(name) === slugify(c.name);
const Empty = ({ text }: { text: string }) => (text ? <p className="blk-empty">{text}</p> : null);

async function PrayerTimesBlock({ b, page }: { b: Extract<LiveBlock, { type: 'prayer-times' }>; page: Page }) {
  const [s, map] = await Promise.all([getPrayerTimes(), getOrgStructure()]);
  if (!s.website.enabled) return null;
  const ref = blockMasjid(b, page);
  const center = (ref && map.centers.find((c) => c.id === ref || c.name === ref)) || map.centers.find((c) => c.active) || null;
  if (!center) return null;
  const jum = center.jumuah.map((j) => j.khutbah);
  const showIq = b.showIqamah && s.website.showIqamah;
  const today = todayCT();
  if (b.view === 'today') {
    const d = dayTimes(s, center.name, today, jum);
    const next = nextPrayer(d, nowMinCT());
    return (
      <section className="blk-prayer" aria-label={`Prayer times today at ${center.name}`}>
        <header className="blk-prayer-head"><h3>Prayer times · {center.name}</h3><span>{dayName(today, { weekday: 'long', month: 'long', day: 'numeric' })}{s.website.showHijri ? ` · ${d.hijri}` : ''}</span></header>
        <ol className="blk-prayer-list">
          {PRAYERS.map((p) => (
            <li key={p} data-next={next && next.prayer === p ? 'true' : undefined}>
              <span className="blk-prayer-name">{PRAYER_NAME[p]}</span>
              <span className="blk-prayer-adhan">{clock(d.adhan[p])}</span>
              {showIq && <span className="blk-prayer-iq">{p === 'sunrise' || !d.iqamah ? '' : clock(d.iqamah[p as (typeof IQAMAH_PRAYERS)[number]])}</span>}
            </li>
          ))}
        </ol>
        {showIq && <p className="blk-prayer-legend">Adhan · Iqamah{next ? ` · Next: ${PRAYER_NAME[next.prayer]} ${next.kind} at ${clock(next.at)}` : ''}</p>}
        {d.special.length > 0 && <ul className="blk-prayer-special">{d.special.map((x, k) => <li key={k}>{x.name}: {x.times.map((t) => fmtTime(t)).join(' · ')}{x.place ? ` – ${x.place}` : ''}</li>)}</ul>}
        <p className="blk-prayer-more"><Link href="/prayer-times">Full month and every masjid →</Link></p>
      </section>
    );
  }
  const [y, m] = today.split('-').map(Number);
  const dates = b.view === 'week' ? Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(y, m - 1, Number(today.slice(8, 10)) + i)).toISOString().slice(0, 10)) : monthDays(y, m);
  return (
    <section className="blk-prayer" aria-label={`Prayer times at ${center.name}`}>
      <header className="blk-prayer-head"><h3>Prayer times · {center.name}</h3><span>{b.view === 'week' ? 'This week' : dayName(today, { month: 'long', year: 'numeric' })}</span></header>
      <div className="blk-table-wrap"><table className="blk-table blk-prayer-table">
        <thead><tr><th scope="col">Date</th>{PRAYERS.map((p) => <th key={p} scope="col">{PRAYER_NAME[p]}</th>)}</tr></thead>
        <tbody>{dates.map((iso) => { const d = dayTimes(s, center.name, iso, jum); return (
          <tr key={iso} data-today={iso === today ? 'true' : undefined}>
            <th scope="row">{dayName(iso, { weekday: 'short', day: 'numeric' })}</th>
            {PRAYERS.map((p) => <td key={p}>{clock(d.adhan[p])}{showIq && d.iqamah && p !== 'sunrise' ? <small>{clock(d.iqamah[p as (typeof IQAMAH_PRAYERS)[number]])}</small> : null}</td>)}
          </tr>); })}</tbody>
      </table></div>
      <p className="blk-prayer-more"><Link href="/prayer-times">Print, iCal and every masjid →</Link></p>
    </section>
  );
}

async function NextJumuahBlock({ b, page }: { b: Extract<LiveBlock, { type: 'next-jumuah' }>; page: Page }) {
  const center = await findCenter(blockMasjid(b, page));
  const map = await getOrgStructure();
  const list = center ? [center] : map.centers.filter((c) => c.active && c.jumuah.length);
  if (!list.length) return null;
  const today = todayCT(); const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); const add = (5 - dow + 7) % 7;
  const friday = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)) + add)).toISOString().slice(0, 10);
  return (
    <section className="blk-jumuah" aria-label="Next Jumuah">
      <h3>{add === 0 ? 'Jumuah today' : `Jumuah · ${dayName(friday, { weekday: 'long', month: 'long', day: 'numeric' })}`}</h3>
      <ul>{list.map((c) => (
        <li key={c.id}><b>{c.name}</b>{c.jumuah.length ? <span>{c.jumuah.map((j) => `${j.label ? `${j.label} ` : ''}${fmtTime(j.khutbah)}`).join(' · ')}</span> : <span>Times to be announced</span>}</li>
      ))}</ul>
    </section>
  );
}

async function EventsBlock({ b, page }: { b: Extract<LiveBlock, { type: 'events' }>; page: Page }) {
  const doc = await getEvents();
  if (!doc.enabled) return <Empty text={b.emptyText} />;
  const center = await findCenter(blockMasjid(b, page));
  const items = upcoming(publicEvents(doc), houstonNowMin()).filter((e) => e.visibility === 'public' && (!b.category || e.category === b.category) && sameCenter(e.location.center, center)).slice(0, b.limit);
  if (!items.length) return <Empty text={b.emptyText} />;
  return (
    <ul className="blk-events">{items.map((e) => (
      <li key={e.id}><Link href={`/events/${e.id}`} className="blk-event">
        <span className="blk-event-date"><b>{dayName(e.start.slice(0, 10), { day: 'numeric' })}</b><span>{dayName(e.start.slice(0, 10), { month: 'short' })}</span></span>
        <span className="blk-event-body"><b>{e.title}</b><span>{fmtRange(e)} · {e.location.name}</span><span className="blk-event-cat">{CATEGORY_LABEL[e.category]}</span></span>
      </Link></li>
    ))}</ul>
  );
}

async function CampaignsBlock({ b, page }: { b: Extract<LiveBlock, { type: 'campaigns' }>; page: Page }) {
  const d = await getFundraising();
  if (!d.website.enabled) return <Empty text={b.emptyText} />;
  const center = await findCenter(blockMasjid(b, page));
  let items: PublicCampaign[];
  if (apiConfig.useMock) items = publicCampaigns(d, mockGifts, mockPledges, todayCT());
  else items = (await apiGet<{ enabled: boolean; campaigns: PublicCampaign[] }>('/public/campaigns', ['doc:fundraising'])).campaigns;
  items = items.filter((c) => c.state === 'live' && sameCenter(c.center, center)).slice(0, b.limit);
  if (!items.length) return <Empty text={b.emptyText} />;
  return (
    <ul className="blk-campaigns">{items.map((c) => (
      <li key={c.id}><Link href={`/campaigns?c=${c.id}`} className="blk-campaign">
        <b>{c.name}</b>
        <span className="blk-bar" role="progressbar" aria-valuenow={c.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.pct}% of goal`}><span style={{ width: `${Math.min(100, c.pct)}%` }} /></span>
        <span className="blk-campaign-meta">{usd(c.totalCents)} of {usd(c.goalCents)} · {c.pct}%{c.daysLeft !== null && c.daysLeft !== undefined ? ` · ${c.daysLeft} days left` : ''}</span>
      </Link></li>
    ))}</ul>
  );
}

async function LeadershipBlock({ b, page }: { b: Extract<LiveBlock, { type: 'leadership' }>; page: Page }) {
  const [doc, map] = await Promise.all([getOfficials(), getOrgStructure()]);
  if (!doc.website.enabled) return null;
  const all = publicOfficials(doc, todayCT());
  const center = b.scope === 'masjid' ? await findCenter(blockMasjid(b, page)) : null;
  const zoneId = b.scope === 'zone' ? (b.zone || center?.zone || '') : '';
  const people = b.scope === 'board' ? all.filter((p) => p.kind === 'officer' || p.kind === 'zonal-director')
    : b.scope === 'zone' ? all.filter((p) => p.zone === zoneId || (p.center && map.centers.find((c) => c.name === p.center)?.zone === zoneId))
    : all.filter((p) => center && sameCenter(p.center, center) && p.center);
  if (!people.length) return null;
  return (
    <ul className="blk-people">{people.map((p, k) => (
      <li key={k} className="blk-person">
        <span className="blk-person-initial" aria-hidden>{p.name.charAt(0)}</span>
        <div><b>{p.name}</b><span className="blk-person-role">{p.seat}</span>{p.termEnd && <span className="blk-person-note">Term ends {p.termEnd.slice(5, 7)}/{p.termEnd.slice(8, 10)}/{p.termEnd.slice(0, 4)}</span>}
          <span className="blk-person-links">{p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}</span></div>
      </li>
    ))}</ul>
  );
}

async function MasjidCardsBlock({ b }: { b: Extract<LiveBlock, { type: 'masjid-cards' }> }) {
  const map = await getOrgStructure();
  const zones = map.zones.filter((z) => z.active && (!b.zone || z.id === b.zone || z.name === b.zone));
  const centers = map.centers.filter((c) => c.active && zones.some((z) => z.id === c.zone));
  if (!centers.length) return null;
  return (
    <ul className="blk-cards blk-masjids" data-n="3">{centers.map((c) => (
      <li key={c.id} className="blk-card"><Link href={`/masjid/${slugify(c.name)}`} className="blk-card-a">
        <div className="blk-card-body">
          <span className="blk-masjid-zone">{map.zones.find((z) => z.id === c.zone)?.name}</span>
          <h3>{c.name}</h3>{c.aka && <p className="blk-masjid-aka">{c.aka}</p>}
          <p>{[c.address.street, c.address.city].filter(Boolean).join(', ')}</p>
          {c.jumuah.length > 0 && <p className="blk-masjid-jum">Jumuah {c.jumuah.map((j) => fmtTime(j.khutbah)).join(' · ')}</p>}
          {c.services.length > 0 && <p className="blk-masjid-services">{c.services.map((s) => SERVICE_LABEL[s]).join(' · ')}</p>}
          <span className="blk-card-link">Visit →</span>
        </div>
      </Link></li>
    ))}</ul>
  );
}

async function DeadlineBlock({ b }: { b: Extract<LiveBlock, { type: 'deadline' }> }) {
  const s = await getMembershipSettings();
  const record = s.recordDate?.slice(0, 10);
  if (!record) return null;
  const today = todayCT();
  const days = Math.round((Date.parse(`${record}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
  const when = dayName(record, { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <aside className="blk-deadline" aria-label="Voting deadline">
      <b>{b.title || 'Keep your vote'}</b>
      {days >= 0 ? <p><strong className="blk-deadline-n">{days}</strong> {days === 1 ? 'day' : 'days'} left · dues paid by {when} count for this year’s elections.</p> : <p>The record date for this year’s elections was {when}. Renew now to be ready for next year.</p>}
      <Link className="btn btn-primary btn-sm" href="/membership/join">Join or renew</Link>
    </aside>
  );
}

async function NewsBlock({ b }: { b: Extract<LiveBlock, { type: 'news' }> }) {
  const news = await getNews(b.limit);
  if (!news.length) return null;
  return (
    <ul className="blk-news">{news.map((n) => (
      <li key={n.slug}><Link href={`/news/${n.slug}`} className="blk-news-a">
        <time dateTime={n.date}>{dayName(n.date, { month: 'short', day: 'numeric', year: 'numeric' })}</time><b>{n.title}</b><span>{n.excerpt}</span>
      </Link></li>
    ))}</ul>
  );
}
async function PlansBlock() {
  const s = await getMembershipSettings();
  const plans = s.plans.filter((p) => p.visible);
  if (!plans.length) return null;
  return (
    <ul className="blk-cards blk-plans" data-n="3">{plans.map((p) => (
      <li key={p.id} className="blk-card" data-featured={p.featured ? 'true' : undefined}><div className="blk-card-body">
        <h3>{p.name}</h3>
        <p className="blk-plan-price"><strong>{formatUSD(p.priceCents)}</strong> <span>{p.unit}</span></p>
        <p>{p.summary}</p>
        {p.perks.length > 0 && <ul className="blk-plan-perks">{p.perks.map((x) => <li key={x}>{x}</li>)}</ul>}
        <p className="blk-plan-vote">{p.votingEligible ? 'Voting member' : 'No voting or office'}</p>
        <Link className="btn btn-primary btn-sm" href={`/membership/join?plan=${p.id}`}>Choose {p.name}</Link>
      </div></li>
    ))}</ul>
  );
}
async function FormBlock({ b }: { b: Extract<LiveBlock, { type: 'form' }> }) {
  const map = await getOrgStructure();
  if (b.kind === 'feedback') return <div className="blk-form"><FeedbackForm /></div>;
  if (b.kind === 'complaint') return <div className="blk-form"><ComplaintForm zones={map.zones.filter((z) => z.active).map((z) => z.name)} /></div>;
  return <div className="blk-form"><VerifyForm /></div>;
}

export async function LiveBlockView({ b, page }: { b: LiveBlock; page: Page }) {
  switch (b.type) {
    case 'prayer-times': return <PrayerTimesBlock b={b} page={page} />;
    case 'next-jumuah': return <NextJumuahBlock b={b} page={page} />;
    case 'events': return <EventsBlock b={b} page={page} />;
    case 'campaigns': return <CampaignsBlock b={b} page={page} />;
    case 'leadership': return <LeadershipBlock b={b} page={page} />;
    case 'masjid-cards': return <MasjidCardsBlock b={b} />;
    case 'deadline': return <DeadlineBlock b={b} />;
    case 'news': return <NewsBlock b={b} />;
    case 'plans': return <PlansBlock />;
    case 'form': return <FormBlock b={b} />;
    default: return null;
  }
}
