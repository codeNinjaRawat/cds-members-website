/**
 * Loads the admin-controlled site configuration.
 *   ISGH_USE_MOCK_API=true  → mock data (until BE phase 3)
 *   otherwise               → GET /public/site-config from BE, validated with zod
 * Never breaks the site: on BE error or invalid data → falls back to the mock config and logs.
 */
import 'server-only';
import { cache } from 'react';
import { apiConfig, apiGet } from '@/lib/api/client';
import { SiteConfigSchema, type SiteConfig } from './schema';
import { mockSiteConfig } from './mock-site-config';
import { readDemoStore } from '@/lib/api/demo-store';

export const SITE_CONFIG_TAG = 'site-config';

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  if (apiConfig.useMock) return (await readDemoStore('site-config', SiteConfigSchema, mockSiteConfig)) ?? mockSiteConfig; // admin demo publish
  try {
    const raw = await apiGet('/public/site-config', [SITE_CONFIG_TAG]);
    const parsed = SiteConfigSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[site-config] BE returned invalid data – using fallback', parsed.error.flatten());
      return mockSiteConfig;
    }
    return parsed.data;
  } catch (err) {
    console.error('[site-config] BE unavailable – using fallback', err);
    return mockSiteConfig;
  }
});
