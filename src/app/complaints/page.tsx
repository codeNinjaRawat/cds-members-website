import type { Metadata } from 'next';
import { ComplaintsView } from '@/components/forms/FormViews';
import { getOrgStructure } from '@/lib/content/loaders';
import { getSiteConfig } from '@/lib/site-config/get-site-config';

export const metadata: Metadata = { title: 'File a complaint' };

/** The zones come from Admin › Masjids and zones; the name from the site settings (every organization its own). */
export default async function ComplaintsPage() {
  const [map, site] = await Promise.all([getOrgStructure(), getSiteConfig()]);
  return <ComplaintsView zones={map.zones.filter((z) => z.active !== false).map((z) => z.name)} org={site.org.shortName} />;
}
