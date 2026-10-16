/**
 * POST /api/events/register – checks a registration against the event's rules and answers registered / waitlisted.
 * Demo: nothing is stored or charged (BE: POST /public/events/{id}/registrations – stores, takes payment, emails).
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEvents, getOrgConfig } from '@/lib/content/loaders';
import { canSee, priceFor, registrationState, seatsFor, typeAvailable } from '@/lib/community/events';
import { getGroups } from '@/lib/content/loaders';
import { applyDiscount } from '@/lib/community/org-config';

const Body = z.object({
  eventId: z.string().max(60), typeId: z.string().max(30), guests: z.number().int().min(0).max(20).default(0),
  code: z.string().max(30).optional(), discount: z.string().max(20).optional(),
  name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().max(254),
  member: z.object({ planId: z.string().max(40).optional(), groupIds: z.array(z.string().max(40)).max(50).optional() }).nullable().optional(), // demo session; BE: from the session cookie
});
const no = (message: string, status = 422) => NextResponse.json({ message }, { status });

export async function POST(req: Request) {
  let json: unknown; try { json = await req.json(); } catch { return no('Invalid request.', 400); }
  const p = Body.safeParse(json); if (!p.success) return no('Please check the form.');
  const doc = await getEvents();
  const e = doc.enabled ? doc.events.find((x) => x.id === p.data.eventId && x.status !== 'draft') : undefined;
  if (!e) return no('Event not found.', 404);
  const now = new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 16);
  const seats = seatsFor(p.data.guests);
  const st = registrationState(e, now, seats);                       // the person + each guest needs a seat
  if (!st.open) return no(st.reason ?? 'Registration is closed.', 409);
  const t = e.registration.types.find((x) => x.id === p.data.typeId);
  if (!t) return no('Choose a registration type.');
  // only groups that exist, are not archived and may limit access count (BE: the member's groups come from the database)
  const groups = await getGroups();
  const usable = new Set(groups.enabled ? groups.groups.filter((g) => !g.archived && g.pageAccess).map((g) => g.id) : []);
  const viewer = { signedIn: !!p.data.member, planId: p.data.member?.planId, groupIds: (p.data.member?.groupIds ?? []).filter((id) => usable.has(id)) };
  if (e.visibility !== 'public' && !viewer.signedIn) return no('This event is for members – sign in first.', 403);
  if (!canSee(e, viewer)) return no('This event is for a group you are not in.', 403);
  const a = typeAvailable(t, viewer, p.data.code, e, seats); if (!a.ok) return no(a.reason ?? 'Not available.', a.reason?.includes('places') ? 409 : 403);
  if (p.data.guests > (e.registration.guests.allowed ? e.registration.guests.max : 0)) return no('Too many guests for this event.');
  let total = priceFor(t, p.data.guests);
  if (p.data.discount) { const d = applyDiscount(await getOrgConfig(), p.data.discount, total, { kind: 'event' }, now.slice(0, 10)); if (!d.ok) return no(d.message); total = d.cents; }
  const ref = `EV-${e.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  return NextResponse.json({ status: st.waitlist ? 'waitlisted' : 'registered', ref, totalCents: st.waitlist ? 0 : total });
}
