import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrayerTimesPage } from '@/components/prayer/PrayerTimesPage';
import { getOrgStructure, getPrayerTimes } from '@/lib/content/loaders';

export const metadata: Metadata = { title: 'Prayer times', description: 'Daily adhan and iqamah times and Jumu’ah at every ISGH Islamic Center in Greater Houston.' };

/** F6 public prayer times (Admin › Prayer times). */
export default async function Page() {
  const [s, map] = await Promise.all([getPrayerTimes(), getOrgStructure()]);
  if (!s.website.enabled) notFound();
  const centers = map.centers.filter((c) => c.active).map((c) => ({ name: c.name, zone: map.zones.find((z) => z.id === c.zone)?.name ?? '', jumuah: c.jumuah.map((j) => j.khutbah) }));
  return <PrayerTimesPage s={s} centers={centers} />;
}
