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
export const getNews = cache(async (limit = 3) =>
  (await loadPublic(`/public/news?limit=${limit}`, z.array(NewsItemSchema), mockNews, ['news'], 'news')).slice(0, limit));

const SLUG_RE = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;
export const getPage = cache(async (slug: string): Promise<Page | null> => {
  if (!SLUG_RE.test(slug)) return null;
  const Pages = z.record(z.string(), PageSchema);
  if (!apiConfig.useMock) return (await siteDoc('pages', Pages))[slug] ?? null;   // API mode: the organization's pages document
  const stored = await readDemoStore('pages', Pages, mockPages); // admin demo publish (or the org's starter pages)
  return (stored ?? mockPages)[slug] ?? null;
});
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
