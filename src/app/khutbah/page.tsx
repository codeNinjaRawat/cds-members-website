/** O6 – /khutbah: next Friday's khutbah schedule across every masjid (admin page `khutbah` replaces it). */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageView } from '@/components/cms/PageView';
import { getPage, getPrayerTimes } from '@/lib/content/loaders';
import { PageSchema } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Friday khutbah schedule', description: 'Who is giving the khutbah this Friday at every masjid, the time and the topic.' };

export default async function KhutbahPage() {
  const custom = await getPage('khutbah');
  if (custom) return <PageView page={custom} />;
  const s = await getPrayerTimes();
  if (!s.khutbah.enabled) notFound();
  const page = PageSchema.parse({ slug: 'khutbah', title: 'Friday khutbah schedule', template: 'hub', updatedAt: new Date().toISOString().slice(0, 10), intro: 'Khateebs, times and topics at every masjid this Friday. Updated by the Khutbah Committee.', blocks: [
    { type: 'khutbah', masjid: '', weeks: 1 },
    { type: 'buttons', items: [...(s.khutbah.feedbackUrl ? [{ label: 'Rate a khutbah', href: s.khutbah.feedbackUrl, style: 'secondary' as const }] : []), { label: 'Suggest a khateeb', href: '/feedback?topic=khateeb', style: 'ghost' as const }, { label: 'Prayer times', href: '/prayer-times', style: 'ghost' as const }] },
  ] });
  return <PageView page={page} />;
}
