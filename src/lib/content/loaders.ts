/** Server loaders for admin-controlled content (BE public API, mock fallback). */
import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { RecordsSchema, mockRecords } from '@/lib/community/records';
import { WorkSettingsSchema, mockWorkSettings } from '@/lib/community/work';
import { loadPublic, siteDoc } from '@/lib/api/load-public';
import { apiConfig } from '@/lib/api/client';
import { readDemoStore } from '@/lib/api/demo-store';
import { HomeSchema, mockHome } from './home';
import { GivingSchema, mockGiving } from './giving';
import { MembershipSettingsSchema, mockMembershipSettings } from './membership';
import { mockNews, mockPages, NewsItemSchema, PageSchema, type Page } from './pages';
import { isLive } from './page-rules';
import { deriveActivity, type Activity } from '@/lib/activity/activity';
import { pageDoc, type SearchDoc } from '@/lib/search/search';
import { publicEvents as publicEventsOf } from '@/lib/community/events';
import { recordsFor } from '@/lib/community/records';
import { ElectionsSchema, mockElections } from '@/lib/community/elections';
import { currentElection, electionYears, publicElection, type PublicElection } from '@/lib/community/public-election';
import { apiGet } from '@/lib/api/client';
import { defaultJoinForm, JoinFormSchema } from '@/lib/join/form-def';
import { EventsSchema, mockEvents } from '@/lib/community/events';
import { mockOrgConfig, OrgConfigSchema } from '@/lib/community/org-config';
import { GroupsSchema, mockGroups } from '@/lib/community/groups';
import { BenefitsSchema, mockBenefits } from '@/lib/community/benefits';
import { OfficialsSchema, mockOfficials } from '@/lib/community/officials';
import { OrgStructureSchema, mockOrgStructure } from '@/lib/community/org-structure';
import { PrayerSettingsSchema, mockPrayerSettings } from '@/lib/community/prayer';
import { FundraisingSchema, mockFundraising } from '@/lib/community/fundraising';
import { SignInSchema, mockSignIn } from '@/lib/community/sign-in';

export const getHome = cache(() => loadPublic('/public/pages/home', HomeSchema, mockHome, ['page:home'], 'home'));
export const getMembershipSettings = cache(() =>
  loadPublic('/public/membership/settings', MembershipSettingsSchema, mockMembershipSettings, ['membership-settings'], 'membership-settings'));
/** Admin › Membership › Join form builder – the sections and fields of the sign-up form */
export const getJoinForm = cache(() => loadPublic('/public/membership/join-form', JoinFormSchema, defaultJoinForm, ['join-form'], 'join-form'));
/** CMS › Giving – verses, impact stories, needs */
export const getGiving = cache(() => loadPublic('/public/giving', GivingSchema, mockGiving, ['giving'], 'giving'));
export const getNews = cache(async (limit = 3) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const all = (await loadPublic(`/public/news?limit=${limit}`, z.array(NewsItemSchema), mockNews, ['news'], 'news')).filter((n) => !n.expiresAt || n.expiresAt >= today);
  return all.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date)).slice(0, limit); // O9: pinned first, expired items hidden
});

const SLUG_RE = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;
const PagesDoc = z.record(z.string(), PageSchema);
/** Every page of this organization (published or not) – admin-composed in Website › Pages. */
export const getPagesDoc = cache(async (): Promise<Record<string, Page>> => {
  if (!apiConfig.useMock) return siteDoc('pages', PagesDoc);          // API mode: the organization's pages document
  return (await readDemoStore('pages', PagesDoc, mockPages)) ?? mockPages; // admin demo publish (or the org's starter pages)
});
/** One page by slug. Visitors only get live pages (O1 schedule/status rules); the admin preview may ask for any. */
export const getPage = cache(async (slug: string, opts: { includeUnpublished?: boolean } = {}): Promise<Page | null> => {
  if (!SLUG_RE.test(slug)) return null;
  const page = (await getPagesDoc())[slug] ?? null;
  if (!page) return null;
  return opts.includeUnpublished || isLive(page) ? page : null;
});
/** Live pages that belong to one masjid (center id) – for masjid navigation (O3). */
export const getMasjidPages = cache(async (center: string): Promise<Page[]> =>
  Object.values(await getPagesDoc()).filter((p) => p.scope.kind === 'masjid' && p.scope.center === center && isLive(p)));
export const listPageSlugs = async () => (!apiConfig.useMock ? [] : Object.keys((await readDemoStore('pages', z.record(z.string(), PageSchema), mockPages)) ?? mockPages));

/** Admin › Events – the organization's events (public list, detail and registration) */
export const getEvents = cache(() => loadPublic('/public/events', EventsSchema, mockEvents, ['events'], 'events'));
/** Admin › Settings › Configuration – directory, payments, member card, discounts (public parts only on the BE) */
/** Admin › Members › Groups – names, join policy and access (BE: only the groups this visitor may see) */
export const getGroups = cache(() => loadPublic('/public/groups', GroupsSchema, mockGroups, ['groups'], 'groups'));
/** Admin › Member benefits – partners and offers (live: GET /member/benefits returns only what this member may see) */
export const getBenefits = cache(() => loadPublic('/member/benefits', BenefitsSchema, mockBenefits, ['benefits'], 'benefits'));
/** Admin › Elected officials – the website shows publicOfficials() only (live: GET /public/leadership returns just that) */
export const getOfficials = cache(() => loadPublic('/public/leadership', OfficialsSchema, mockOfficials, ['officials'], 'officials'));
/** Admin › Zones and centers – zones, ZIP codes and centers (public parts) */
export const getOrgStructure = cache(() => loadPublic('/public/centers', OrgStructureSchema, mockOrgStructure, ['org-structure'], 'org-structure'));
/** Admin › Prayer times – calculation, iqamah rules per center, special prayers */
export const getPrayerTimes = cache(() => loadPublic('/public/prayer-times', PrayerSettingsSchema, mockPrayerSettings, ['prayer-times'], 'prayer-times'));
/** Admin › Fundraising – campaigns and approved personal pages (live: GET /public/campaigns with totals) */
/** Help desk settings: only the public part (publicHelpdesk) may reach a browser. */
export const getWorkSettings = cache(() => loadPublic('/public/helpdesk', WorkSettingsSchema, mockWorkSettings, ['work-settings'], 'work-settings'));
export const getRecords = cache(() => loadPublic('/public/records', RecordsSchema, mockRecords, ['records'], 'records'));
export const getFundraising = cache(() => loadPublic('/public/campaigns', FundraisingSchema, mockFundraising, ['fundraising'], 'fundraising'));
/** Admin › Settings › Sign-in – which sign-in methods show and what each dashboard is called (M4) */
export const getSignIn = cache(() => loadPublic('/public/sign-in', SignInSchema, mockSignIn, ['sign-in'], 'sign-in'));
export const getOrgConfig = cache(() => loadPublic('/public/config', OrgConfigSchema, mockOrgConfig, ['org-config'], 'org-config'));

/** O4 – derived activity for the whole organization (filter per masjid with forMasjid). Public data only. */
export const getActivity = cache(async (): Promise<Activity[]> => {
  const [map, events, news, fundraising, officials, prayer, records, pages] = await Promise.all([
    getOrgStructure(), getEvents(), getNews(100), getFundraising(), getOfficials(), getPrayerTimes(), getRecords(), getPagesDoc(),
  ]);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  return deriveActivity({ map, events, news, fundraising, officials, prayer, records, pages: Object.values(pages) }, today);
});

/** O2 – everything the site search may show (public content only). */
export const getSearchDocs = cache(async (): Promise<SearchDoc[]> => {
  const [pages, map, events, news, fundraising, records] = await Promise.all([getPagesDoc(), getOrgStructure(), getEvents(), getNews(200), getFundraising(), getRecords()]);
  const docs: SearchDoc[] = [];
  for (const p of Object.values(pages)) { const d = pageDoc(p); if (d) docs.push(d); }
  for (const c of map.centers.filter((c) => c.active)) docs.push({ kind: 'masjid', title: c.name, href: `/masjid/${c.id}`, text: `${c.aka} ${c.address.street} ${c.address.city} ${c.address.zip} ${c.profile.story} ${c.services.join(' ')}`, masjid: c.id });
  for (const z of map.zones.filter((z) => z.active)) docs.push({ kind: 'zone', title: z.name, href: `/zones/${z.id}`, text: `${z.areas} ${z.director.name}` });
  for (const n of news) docs.push({ kind: 'news', title: n.title, href: `/news/${n.slug}`, text: n.excerpt, date: n.date, masjid: n.masjid });
  if (events.enabled) for (const e of publicEventsOf(events).events) if (e.visibility === 'public') docs.push({ kind: 'event', title: e.title, href: `/events/${e.id}`, text: `${e.summary} ${e.location.name} ${e.location.address}`, date: e.start, masjid: e.location.center });
  if (fundraising.website.enabled) for (const c of fundraising.campaigns) if (c.status !== 'draft') docs.push({ kind: 'campaign', title: c.name, href: `/campaigns?c=${c.id}`, text: c.story, date: c.start, masjid: c.center });
  if (records.website.enabled) for (const r of recordsFor(records, 'public')) if (!r.archived) docs.push({ kind: 'record', title: r.title, href: '/records', text: r.summary, date: r.date, masjid: r.center });
  return docs;
});

/** O10 – the public view of one election (demo: from the elections document; live: GET /public/elections/:year). year 0/undefined = the featured one. */
export const getPublicElection = cache(async (year?: number): Promise<PublicElection | null> => {
  if (apiConfig.useMock) {
    const d = (await readDemoStore('elections', ElectionsSchema, mockElections)) ?? mockElections;
    const e = year ? d.elections.find((x) => x.year === year) ?? null : currentElection(d);
    return e ? publicElection(e) : null;
  }
  const y = year || new Date().getFullYear();
  for (const yy of year ? [y] : [y, y - 1]) {
    try { const r = await apiGet<Omit<PublicElection, 'statusKey'> & { status: string }>(`/public/elections/${yy}`, ['doc:elections']); return { ...r, statusKey: (Object.entries({ planning: 'Planning', nominations: 'Nominations open', ballot: 'Ballot set', voting: 'Voting', counting: 'Counting', certified: 'Certified', closed: 'Closed' }).find(([, v]) => v === r.status)?.[0] ?? 'planning') as PublicElection['statusKey'] }; } catch { /* no election that year */ }
  }
  return null;
});
export const getElectionYears = cache(async (): Promise<number[]> => {
  if (apiConfig.useMock) return electionYears((await readDemoStore('elections', ElectionsSchema, mockElections)) ?? mockElections);
  const y = new Date().getFullYear(); const out: number[] = [];
  for (const yy of [y, y - 1, y - 2]) { try { await apiGet(`/public/elections/${yy}`, ['doc:elections']); out.push(yy); } catch { /* none */ } }
  return out;
});
