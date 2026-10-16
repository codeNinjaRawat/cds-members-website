import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEvents } from '@/lib/content/loaders';
import { EventDetailView } from '@/components/events/EventsViews';
import { publicEvent } from '@/lib/community/events';

type P = { params: Promise<{ id: string }> };
const houstonNow = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 16);
const find = async (id: string) => { const d = await getEvents(); const e = d.enabled ? d.events.find((x) => x.id === id) : undefined; return e && e.status !== 'draft' ? e : null; };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = await find((await params).id);
  return e ? (e.visibility === 'groups' ? { title: 'Group event', robots: { index: false } } : { title: e.title, description: e.summary || undefined }) : {};
}
export default async function EventPage({ params }: P) {
  const e = await find((await params).id);
  if (!e) notFound();
  return <EventDetailView e={publicEvent(e)} now={houstonNow()} />;
}
