/**
 * DEMO STORE – lets the admin app control the website before the BE exists (no API calls).
 * The admin "Publish" button writes JSON files into a shared folder (default: ../.demo-store next to web/ and admin/).
 * In mock mode the website reads those files on every request; if a file is missing or invalid it uses the
 * built-in content, so the site never breaks. When the BE is live (ISGH_USE_MOCK_API=false) this is not used.
 *   Keys: site-config, home, membership-settings, giving, pages, news, themes, join-form
 *
 * SaaS: one website serves every organization. The address (Host header) decides which one:
 *   ISGH → the store folder itself (as before) · any other organization → <store>/tenants/<slug>/
 * An organization that has not published something yet gets starter content made from its profile (seed.ts).
 */
import { SIMPLE_WORK_PRESET } from '@/lib/community/work';
import 'server-only';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { headers } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import type { ZodType, ZodTypeDef } from 'zod';
import { apiConfig } from './client';
import { tenantDir, tenantForHost, type TenantLookup } from '@/lib/platform/platform-store';
import { seedFor } from '@/lib/platform/seed';

export const DEMO_STORE_KEYS = ['site-config', 'home', 'membership-settings', 'giving', 'pages', 'news', 'themes', 'join-form', 'events', 'groups', 'communication', 'org-config', 'benefits', 'officials', 'org-structure', 'prayer-times', 'fundraising', 'sign-in', 'admin-access', 'records', 'elections', 'work-settings'] as const; // admin-access: server only (sign-in dashboards), never sent to a browser as a whole
export type DemoStoreKey = (typeof DEMO_STORE_KEYS)[number];

export const demoStoreDir = () => process.env.ISGH_DEMO_STORE ?? path.resolve(process.cwd(), '..', '.demo-store');

/** Which organization this request is for (once per request). Outside a request (build time) → ISGH_TENANT / isgh. */
export const currentTenant = cache(async (): Promise<TenantLookup> => {
  let host: string | null = null;
  try { host = (await headers()).get('host'); } catch { /* build time / no request */ }
  return tenantForHost(host);
});

/**
 * Returns the admin-published value for `key`, or the organization's starter content, or null (= use the built-in
 * ISGH content: ISGH, nothing published, not mock mode). `isghDefault` is needed for starter content.
 */
export async function readDemoStore<T>(key: DemoStoreKey, schema?: ZodType<T, ZodTypeDef, unknown>, isghDefault?: T): Promise<T | null> {
  if (!apiConfig.useMock || process.env.ISGH_DEMO_STORE === 'off') return null;
  try { noStore(); } catch { /* outside a request (e.g. build-time static params) */ } // admin may publish any time → read fresh
  const { tenant, slug } = await currentTenant();
  const dir = tenantDir(slug);
  const file = path.join(dir, `${key}.json`);
  if (existsSync(file)) {
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as { data?: unknown };
      const value = raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw;
      if (!schema) return value as T;
      const parsed = schema.safeParse(value);
      if (parsed.success) return parsed.data;
      console.error(`[demo-store] ${slug}/${key}.json is invalid – using the default`, parsed.error.flatten().fieldErrors);
    } catch (err) {
      console.error(`[demo-store] could not read ${slug}/${key}.json – using the default`, err);
    }
  }
  if (tenant && slug !== 'isgh' && key === 'work-settings') return SIMPLE_WORK_PRESET as T; // other organizations start simple, nobody pre-assigned
  if (tenant && slug !== 'isgh' && isghDefault !== undefined && key !== 'admin-access' && key !== 'work-settings') return seedFor(key, isghDefault, tenant); // never another organization's admins
  return null;
}
