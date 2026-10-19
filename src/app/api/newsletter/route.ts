/**
 * POST /api/newsletter – validates and forwards to the API: POST /public/newsletter
 * BE stores consent (text + timestamp + IP), sends the double opt-in email via the email gateway (see memory/20-integrations.md).
 * Mock mode: accepts and logs nothing personal.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiConfig, apiPost } from '@/lib/api/client';

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
  consentText: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 422 });

  if (apiConfig.useMock) return NextResponse.json({ status: 'pending_confirmation' }, { status: 202 });

  try {
    await apiPost('/public/newsletter', { ...parsed.data, source: 'website-footer' });
    return NextResponse.json({ status: 'pending_confirmation' }, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
