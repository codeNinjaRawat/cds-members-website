/**
 * POST /api/auth/otp/start – send a 6-digit code by email (or SMS when enabled).
 * Live: API POST /auth/code/start (rate-limited per address/IP, code hashed, expires, email gateway). The browser in live
 * mode calls /api/be/auth/code/start directly; this route stays for older pages.
 * Mock: no message is sent; the code is always 123456 and returned as devCode so the flow can be tested.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiConfig, apiPost } from '@/lib/api/client';

const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254), channel: z.enum(['email', 'sms']).default('email') });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_email' }, { status: 422 });
  if (apiConfig.useMock) return NextResponse.json({ sent: true, devCode: '123456' });
  try {
    await apiPost('/auth/code/start', { address: parsed.data.email });
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
