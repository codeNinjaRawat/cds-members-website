/** POST /api/centers/lookup – address → zone + center. Live: API GET /public/place?zip= (ZIP → masjid → zone; nearest masjids when none serves it). */
import { NextResponse } from 'next/server';
import { apiConfig, apiGet } from '@/lib/api/client';
import { LookupRequestSchema, LookupResultSchema, mockLookup } from '@/lib/join/residency';

export async function POST(req: Request) {
  const parsed = LookupRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_address' }, { status: 422 });
  if (apiConfig.useMock) return NextResponse.json(mockLookup(parsed.data));
  try {
    const d = await apiGet<{ zone: string | null; zone_name: string | null; center: string | null; center_name: string | null; nearest?: { id: string; name: string; miles: number }[] }>(`/public/place?zip=${encodeURIComponent(parsed.data.zip.slice(0, 5))}`, ['place']);
    return NextResponse.json(LookupResultSchema.parse({ inServiceArea: !!d.center, zone: d.zone ? { id: d.zone, name: d.zone_name ?? d.zone } : null, center: d.center ? { id: d.center, name: d.center_name ?? d.center } : null,
      nearBorder: false, alternatives: (d.nearest ?? []).map((n) => ({ id: n.id, name: n.name, zoneName: '', miles: n.miles })), estimate: false }));
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
