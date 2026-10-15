/**
 * POST /api/auth/otp/verify – check the code. Real: BE POST /public/auth/otp/verify → session cookie (httpOnly).
 * Response tells the UI if this email already has a membership (offer sign-in/renew instead of a duplicate).
 * Mock: code 123456; email "member@example.com" simulates an existing member.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiConfig, apiPost } from '@/lib/api/client';

const Body = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().regex(/^\d{6}$/) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_code' }, { status: 422 });
  if (apiConfig.useMock) {
    if (parsed.data.code !== '123456') return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
    return NextResponse.json({ verified: true, existingMember: parsed.data.email === 'member@example.com' });
  }
  try {
    const r = await apiPost<{ verified: boolean; existingMember: boolean }>('/public/auth/otp/verify', parsed.data);
    return NextResponse.json(r);
  } catch {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  }
}
