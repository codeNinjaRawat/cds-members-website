/**
 * Website theme (colors, fonts, radii) – controlled by admin "Website theme editor" (module A8).
 *   Mock mode → src/lib/theme/default-themes.json (copied from design/tokens/themes.json)
 *   BE mode   → GET /public/theme (same JSON shape), contrast-checked before use
 */
import 'server-only';
import { cache } from 'react';
import { apiConfig, apiGet } from '@/lib/api/client';
import defaultThemes from './default-themes.json';
import { buildThemeCss, checkContrast, type ThemesFile } from './theme-css';
import { readDemoStore } from '@/lib/api/demo-store';

export const THEME_TAG = 'theme';

export const getThemes = cache(async (): Promise<ThemesFile> => {
  const fallback = defaultThemes as unknown as ThemesFile;
  if (apiConfig.useMock) {
    const stored = await readDemoStore<ThemesFile>('themes', undefined, fallback); // admin demo publish – same contrast gate as the BE path
    if (stored?.themes && !checkContrast(stored).length) return stored;
    if (stored) console.error('[theme] demo-store theme failed contrast check – using fallback', checkContrast(stored));
    return fallback;
  }
  try {
    const remote = await apiGet<ThemesFile>('/public/theme', [THEME_TAG]);
    const problems = checkContrast(remote);
    if (problems.length) {
      console.error('[theme] Admin theme failed contrast check – using fallback', problems);
      return fallback;
    }
    return remote;
  } catch (err) {
    console.error('[theme] BE unavailable – using fallback theme', err);
    return fallback;
  }
});

export async function getThemeCss(active: string): Promise<string> {
  const themes = await getThemes();
  return buildThemeCss(themes, themes.themes[active] ? active : themes.default);
}
