/** Server loaders for admin-controlled content (BE public API, mock fallback). */
import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { loadPublic } from '@/lib/api/load-public';
import { readDemoStore } from '@/lib/api/demo-store';
import { HomeSchema, mockHome } from './home';
import { GivingSchema, mockGiving } from './giving';
import { MembershipSettingsSchema, mockMembershipSettings } from './membership';
import { mockNews, mockPages, NewsItemSchema, PageSchema, type Page } from './pages';
import { defaultJoinForm, JoinFormSchema } from '@/lib/join/form-def';

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
  const stored = await readDemoStore('pages', z.record(z.string(), PageSchema), mockPages); // admin demo publish (or the org's starter pages)
  const mock = (stored ?? mockPages)[slug] ?? null;
  if (!mock && (process.env.ISGH_USE_MOCK_API ?? 'true') === 'true') return null;
  return loadPublic(`/public/pages/${slug}`, PageSchema.nullable(), mock, [`page:${slug}`]);
});
export const listPageSlugs = async () => Object.keys((await readDemoStore('pages', z.record(z.string(), PageSchema), mockPages)) ?? mockPages);
