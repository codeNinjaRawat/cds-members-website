/**
 * O4 – Activity engine (derived). "What is happening at this masjid / in the network" is computed from the documents
 * admins already keep – nothing is typed twice and nothing new is stored:
 *   events (published, upcoming / just held) · news (announcements) · campaigns (started, ending soon, closed)
 *   · officials (new leader took office, seat vacant) · iqamah rules (times change on a date) · special prayers
 *   (Eid, taraweeh…) · records (minutes / reports published – public ones only) · elections (status milestones)
 *   · website pages (a masjid page updated).
 * Members-only data never appears: only public events, public records and the officials the website may show.
 * Pure functions – documents are passed in; the loader lives in content/loaders.ts.
 */
import type { EventsDoc } from '@/lib/community/events';
import { publicEvents } from '@/lib/community/events';
import type { Fundraising } from '@/lib/community/fundraising';
import type { Officials } from '@/lib/community/officials';
import { publicOfficials, seatLabel } from '@/lib/community/officials';
import type { OrgStructure } from '@/lib/community/org-structure';
import type { PrayerSettings } from '@/lib/community/prayer';
import { PRAYER_NAME, type IqPrayer } from '@/lib/community/prayer';
import type { Records } from '@/lib/community/records';
import type { ElectionsDoc } from '@/lib/community/elections';
import { ELECTION_STATUS } from '@/lib/community/elections';
import type { NewsItem, Page } from '@/lib/content/pages';

export const ACTIVITY_KINDS = ['event', 'announcement', 'campaign', 'leadership', 'prayer', 'special', 'record', 'election', 'page'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export const KIND_LABEL: Record<ActivityKind, string> = { event: 'Events', announcement: 'Announcements', campaign: 'Giving', leadership: 'Leadership', prayer: 'Prayer times', special: 'Special prayers', record: 'Documents', election: 'Elections', page: 'Pages' };

export type Activity = {
  id: string; kind: ActivityKind;
  /** Center id ('' = organization-wide) and the human name for display */
  masjid: string; masjidName: string;
  at: string;              // ISO date (YYYY-MM-DD) or datetime (YYYY-MM-DDTHH:MM) in Houston time
  title: string; summary: string; href: string;
  /** 'past' happened at `at`; 'upcoming' will happen at `at` (an event, a date when times change) */
  tense: 'past' | 'upcoming';
};

export type ActivitySources = {
  map: OrgStructure; events?: EventsDoc; news?: NewsItem[]; fundraising?: Fundraising; officials?: Officials; prayer?: PrayerSettings;
  records?: Records; elections?: ElectionsDoc; pages?: Page[];
};

const day = (s: string) => s.slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** Finds the center a document names (id or name) → center id, or ''. */
function centerId(map: OrgStructure, ref: string | undefined): string {
  if (!ref) return '';
  const c = map.centers.find((x) => x.id === ref || x.name === ref);
  return c ? c.id : '';
}
const nameOf = (map: OrgStructure, id: string) => map.centers.find((c) => c.id === id)?.name ?? '';
/** "MM-DD" rule boundary → the next real date on or after `today` (within a year). */
function nextMmdd(mmdd: string, today: string): string {
  const y = Number(today.slice(0, 4)); const cand = `${y}-${mmdd}`;
  return cand >= today ? cand : `${y + 1}-${mmdd}`;
}

/** Every activity item the sources yield, within [today − pastDays, today + futureDays]. Sorted newest-first for past items, soonest-first for upcoming. */
export function deriveActivity(src: ActivitySources, today: string, opts: { pastDays?: number; futureDays?: number } = {}): Activity[] {
  const { map } = src; const pastDays = opts.pastDays ?? 60; const futureDays = opts.futureDays ?? 45;
  const from = addDays(today, -pastDays); const to = addDays(today, futureDays);
  const out: Activity[] = [];
  const push = (a: Omit<Activity, 'masjidName'>) => { if (day(a.at) >= from && day(a.at) <= to) out.push({ ...a, masjidName: nameOf(map, a.masjid) }); };

  if (src.events?.enabled) for (const e of publicEvents(src.events).events) {
    if (e.visibility !== 'public') continue;
    const m = centerId(map, e.location.center);
    if (e.status === 'cancelled') push({ id: `event:${e.id}:cancelled`, kind: 'event', masjid: m, at: day(e.start), title: `Cancelled: ${e.title}`, summary: e.summary, href: `/events/${e.id}`, tense: day(e.start) >= today ? 'upcoming' : 'past' });
    else push({ id: `event:${e.id}`, kind: 'event', masjid: m, at: e.start.slice(0, 16), title: e.title, summary: e.summary || e.location.name, href: `/events/${e.id}`, tense: day(e.start) >= today ? 'upcoming' : 'past' });
  }
  for (const n of src.news ?? []) push({ id: `news:${n.slug}`, kind: 'announcement', masjid: centerId(map, n.masjid), at: n.date, title: n.title, summary: n.excerpt, href: `/news/${n.slug}`, tense: 'past' });

  if (src.fundraising?.website.enabled) for (const c of src.fundraising.campaigns) {
    if (c.status === 'draft') continue;
    const m = centerId(map, c.center); const href = `/campaigns?c=${c.id}`;
    push({ id: `campaign:${c.id}:start`, kind: 'campaign', masjid: m, at: c.start, title: `Campaign started: ${c.name}`, summary: c.story.slice(0, 140), href, tense: c.start > today ? 'upcoming' : 'past' });
    if (c.end) {
      if (c.status === 'closed' || c.end < today) push({ id: `campaign:${c.id}:end`, kind: 'campaign', masjid: m, at: c.end, title: `Campaign ended: ${c.name}`, summary: 'Thank you to everyone who gave.', href, tense: 'past' });
      else push({ id: `campaign:${c.id}:ending`, kind: 'campaign', masjid: m, at: c.end, title: `Last day to give: ${c.name}`, summary: 'The campaign closes on this day.', href, tense: 'upcoming' });
    }
  }

  if (src.officials?.website.enabled) {
    const pub = new Set(publicOfficials(src.officials, today).map((p) => p.name + p.seat));
    for (const h of src.officials.holders) {
      const m = centerId(map, h.center); const seat = seatLabel(h);
      if (h.status === 'serving' && h.showOnWebsite && h.name && h.termStart && pub.has(h.name + seat)) push({ id: `official:${h.id}:start`, kind: 'leadership', masjid: m, at: h.termStart, title: `${h.name} took office as ${seat}`, summary: h.how === 'elected' ? 'Elected by the members.' : 'Appointed to the seat.', href: m ? `/masjid/${m}/leadership` : '/leadership', tense: h.termStart > today ? 'upcoming' : 'past' });
      if (h.status === 'vacant' && h.vacancy.on) push({ id: `official:${h.id}:vacant`, kind: 'leadership', masjid: m, at: h.vacancy.on, title: `${seat} is vacant`, summary: 'The seat will be filled by appointment or election.', href: m ? `/masjid/${m}/leadership` : '/leadership', tense: 'past' });
    }
  }

  if (src.prayer?.website.enabled) {
    for (const ct of src.prayer.centers) {
      const m = centerId(map, ct.center); if (!m) continue;
      for (const p of Object.keys(ct.iqamah) as IqPrayer[]) for (const r of ct.iqamah[p]) {
        const at = nextMmdd(r.from, today);
        if (at !== today && at <= to && at > today) push({ id: `iqamah:${m}:${p}:${r.from}`, kind: 'prayer', masjid: m, at, title: `${PRAYER_NAME[p]} iqamah changes`, summary: r.kind === 'fixed' ? `From ${at.slice(5, 7)}/${at.slice(8, 10)}: ${r.time}` : `From ${at.slice(5, 7)}/${at.slice(8, 10)}: ${r.minutes} minutes after the adhan`, href: `/masjid/${m}/prayer-times`, tense: 'upcoming' });
      }
    }
    for (const s of src.prayer.special) push({ id: `special:${s.id}`, kind: 'special', masjid: centerId(map, s.center), at: s.date, title: s.name, summary: `${s.times.join(' · ')}${s.place ? ` · ${s.place}` : ''}`, href: s.center ? `/masjid/${centerId(map, s.center)}/prayer-times` : '/prayer-times', tense: s.date >= today ? 'upcoming' : 'past' });
  }

  if (src.records?.website.enabled) for (const r of src.records.items) {
    if (r.archived || r.audience !== 'public') continue;
    push({ id: `record:${r.id}`, kind: 'record', masjid: centerId(map, r.center), at: r.date, title: r.title, summary: r.summary || 'Published document', href: '/records', tense: 'past' });
  }

  if (src.elections) for (const e of src.elections.elections) {
    if (e.status === 'planning') continue;
    push({ id: `election:${e.year}:${e.status}`, kind: 'election', masjid: '', at: e.electionDay && e.status === 'voting' ? e.electionDay : today, title: `${e.year} election: ${ELECTION_STATUS[e.status]}`, summary: e.status === 'nominations' ? 'Members may nominate candidates.' : e.status === 'voting' ? 'Eligible members vote.' : e.status === 'certified' ? 'Results are certified.' : '', href: '/elections', tense: e.status === 'voting' && e.electionDay > today ? 'upcoming' : 'past' });
  }

  for (const p of src.pages ?? []) if (p.scope.kind === 'masjid' && p.status === 'published') push({ id: `page:${p.slug}`, kind: 'page', masjid: p.scope.center, at: p.updatedAt, title: `Page updated: ${p.title}`, summary: p.intro ?? '', href: `/${p.slug}`, tense: 'past' });

  const seen = new Set<string>();
  return out.filter((a) => !seen.has(a.id) && seen.add(a.id)).sort((a, b) => (a.tense === b.tense ? (a.tense === 'past' ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at)) : a.tense === 'upcoming' ? -1 : 1));
}

/** Items for one masjid (its own + organization-wide), or for the organization (everything). */
export const forMasjid = (items: Activity[], masjid: string, includeOrg = true) => (masjid ? items.filter((a) => a.masjid === masjid || (includeOrg && !a.masjid)) : items);
export const byKind = (items: Activity[], kinds: ActivityKind[]) => (kinds.length ? items.filter((a) => kinds.includes(a.kind)) : items);
/** "This week": upcoming items within the next 7 days + past items from the last 7 days. */
export function thisWeek(items: Activity[], today: string): { upcoming: Activity[]; recent: Activity[] } {
  const end = addDays(today, 7); const start = addDays(today, -7);
  return { upcoming: items.filter((a) => a.tense === 'upcoming' && day(a.at) <= end), recent: items.filter((a) => a.tense === 'past' && day(a.at) >= start) };
}
/** RSS 2.0 for feed readers and WhatsApp/Zapier automations. */
export function toRss(items: Activity[], meta: { title: string; link: string; description: string }): string {
  const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
  const rfc = (at: string) => new Date(`${at.length === 10 ? `${at}T12:00` : at}:00-05:00`).toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(meta.title)}</title><link>${esc(meta.link)}</link><description>${esc(meta.description)}</description>\n` +
    items.slice(0, 50).map((a) => `<item><title>${esc(a.title)}</title><link>${esc(meta.link.replace(/\/$/, '') + a.href)}</link><guid isPermaLink="false">${esc(a.id)}</guid><pubDate>${rfc(a.at)}</pubDate><category>${esc(KIND_LABEL[a.kind])}</category><description>${esc(a.summary)}</description></item>`).join('\n') +
    `\n</channel></rss>`;
}
