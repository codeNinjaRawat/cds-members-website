/** POST /api/centers/lookup – address → zone + center. Proxies BE POST /public/residency/lookup (mock until B6). */
import { NextResponse } from 'next/server';
import { apiConfig, apiPost } from '@/lib/api/client';
import { LookupRequestSchema, LookupResultSchema, mockLookup } from '@/lib/join/residency';

export async function POST(req: Request) {
  const parsed = LookupRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_address' }, { status: 422 });
  if (apiConfig.useMock) return NextResponse.json(mockLookup(parsed.data));
  try {
    const result = LookupResultSchema.parse(await apiPost('/public/residency/lookup', parsed.data));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
