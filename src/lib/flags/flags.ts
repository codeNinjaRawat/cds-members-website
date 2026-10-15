/** Feature flags come from admin (BE) inside the site config. Unknown flag = off. */
import type { SiteConfig } from '@/lib/site-config/schema';

export type PublicFlag = 'site.announcement' | 'cms.newsletter' | 'site.themeToggle' | 'i18n.languages';

export function isOn(config: Pick<SiteConfig, 'flags'>, flag: PublicFlag): boolean {
  return config.flags[flag] === true;
}
