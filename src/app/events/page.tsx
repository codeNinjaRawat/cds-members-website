import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEvents } from '@/lib/content/loaders';
import { EventsListView } from '@/components/events/EventsViews';
import { publicEvents } from '@/lib/community/events';

export const metadata: Metadata = { title: 'Events', description: 'Meetings, programs and gatherings at our Islamic Centers.' };
const houstonNow = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 16);

/** Admin › Events. Off in Configuration → the page does not exist. */
export default async function EventsPage() {
  const doc = await getEvents();
  if (!doc.enabled) notFound();
  return <EventsListView doc={publicEvents(doc)} now={houstonNow()} />; // registration codes stay on the server
}
