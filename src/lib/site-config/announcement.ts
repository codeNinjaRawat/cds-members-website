/** Announcement helpers shared by server (layout) and client (AnnouncementBar). */
import type { Announcement } from './schema';

export const dismissKey = (id: string) => `dismissed:${id}`;

export function isWithinWindow(a: Pick<Announcement, 'startsAt' | 'endsAt'>, now = Date.now()): boolean {
  if (a.startsAt && now < Date.parse(a.startsAt)) return false;
  if (a.endsAt && now > Date.parse(a.endsAt)) return false;
  return true;
}
