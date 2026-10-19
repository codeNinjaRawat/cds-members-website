/**
 * POST /api/auth/otp/verify – check the code. Live: API POST /auth/code/verify → session cookie (httpOnly) for this website.
 * Response tells the UI if this email already has a membership (offer sign-in/renew instead of a duplicate).
 * Mock: code 123456; email "member@example.com" simulates an existing member.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiCall, apiConfig } from '@/lib/api/client';

const Body = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().regex(/^\d{6}$/) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_code' }, { status: 422 });
  if (apiConfig.useMock) {
    if (parsed.data.code !== '123456') return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
    return NextResponse.json({ verified: true, existingMember: parsed.data.email === 'member@example.com' });
  }
  try {
    const r = await apiCall('POST', '/auth/code/verify', { address: parsed.data.email, code: parsed.data.code });
    if (r.status >= 400) return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
    const b = r.body as { dashboards?: { kind: string }[] };
    const res = NextResponse.json({ verified: true, existingMember: !!b.dashboards?.some((d) => d.kind === 'member') });
    for (const c of r.setCookie) res.headers.append('set-cookie', c.replace(/;\s*domain=[^;]*/i, ''));   // the session cookie for this website
    return res;
  } catch {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  }
}
