/**
 * PUT /api/preferences – save a member's email / text choices. Official topics (membership and election notices) can
 * never be opted out of; unknown topics are refused. Demo: answers only (BE: PUT /member/preferences, audit logged,
 * SMS consent stored with time and the exact consent text – TCPA).
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { TOPICS, TOPIC_KEYS, type Topic } from '@/lib/community/campaigns';

const Body = z.object({ email: z.boolean(), sms: z.boolean(), optOut: z.array(z.string().max(30)).max(20) });

export async function PUT(req: Request) {
  let json: unknown; try { json = await req.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  const p = Body.safeParse(json); if (!p.success) return NextResponse.json({ message: 'Please check your choices.' }, { status: 422 });
  const bad = p.data.optOut.filter((t) => !TOPIC_KEYS.includes(t as Topic));
  if (bad.length) return NextResponse.json({ message: `Unknown kind of message: ${bad.join(', ')}.` }, { status: 422 });
  const locked = p.data.optOut.filter((t) => !TOPICS[t as Topic].optional);
  if (locked.length) return NextResponse.json({ message: 'Membership and election notices are always sent to members.' }, { status: 422 });
  return NextResponse.json({ prefs: { email: p.data.email, sms: p.data.sms, optOut: Array.from(new Set(p.data.optOut)) } });
}
