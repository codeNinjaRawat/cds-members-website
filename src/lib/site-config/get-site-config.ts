/**
 * Loads the admin-controlled site configuration.
 *   ISGH_USE_MOCK_API=true  → mock data (until BE phase 3)
 *   otherwise               → GET /site/documents/site-config from the API, validated with zod
 */
import 'server-only';
import { cache } from 'react';
import { apiConfig } from '@/lib/api/client';
import { siteDoc } from '@/lib/api/load-public';
import { SiteConfigSchema, type SiteConfig } from './schema';
import { mockSiteConfig } from './mock-site-config';
import { readDemoStore } from '@/lib/api/demo-store';

export const SITE_CONFIG_TAG = 'site-config';

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  if (apiConfig.useMock) return (await readDemoStore('site-config', SiteConfigSchema, mockSiteConfig)) ?? mockSiteConfig; // admin demo publish
  return siteDoc('site-config', SiteConfigSchema);   // API mode: the organization's own (an error page rather than ISGH's mock)
});
