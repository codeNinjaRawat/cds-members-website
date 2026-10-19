import type { Metadata } from 'next';
import { getWorkSettings } from '@/lib/content/loaders';
import { publicHelpdesk } from '@/lib/community/work';
import { MyRequests } from '@/components/account/PortalWork';

export const metadata: Metadata = { title: 'Ask or tell us', robots: { index: false } };

/** Member portal › Ask or tell us – help-desk categories from Settings › Help desk and tasks (public part only). */
export default async function Page() {
  return <MyRequests helpdesk={publicHelpdesk(await getWorkSettings())} />;
}
