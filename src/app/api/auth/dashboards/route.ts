/**
 * POST /api/auth/dashboards – M4: after signing in, the dashboards this person may open (membership, organization,
 * zone, masjid, ZIP area). Live: API GET /auth/me from the session cookie – never by an email in the body.
 * Mock: the demo code proves the sign-in; roles come from Admin › Admins and roles (demo store) or the built-in list.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiConfig, apiGet } from '@/lib/api/client';
import { currentTenant, readDemoStore } from '@/lib/api/demo-store';
import { AccessSchema, mockAccess } from '@/lib/community/access';
import { dashboardsFor, type Dashboard } from '@/lib/community/sign-in';
import { getSignIn } from '@/lib/content/loaders';

const Body = z.object({ email: z.string().trim().toLowerCase().email().max(254), code: z.string().regex(/^\d{6}$/), member: z.boolean() });
const ZONE: Record<string, string> = { n: 'North Zone', nw: 'Northwest Zone', sw: 'Southwest Zone', s: 'South Zone', se: 'Southeast Zone' };
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 422 });
  if (!apiConfig.useMock) {
    try { const me = await apiGet<{ dashboards: Dashboard[] }>('/auth/me', [], { session: true }); return NextResponse.json({ dashboards: me.dashboards }); }
    catch { return NextResponse.json({ error: 'unavailable' }, { status: 503 }); }
  }
  if (parsed.data.code !== '123456') return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  const stored = await readDemoStore('admin-access', AccessSchema);
  const isgh = (await currentTenant()).slug === 'isgh';
  if (!stored && !isgh) return NextResponse.json({ dashboards: parsed.data.member ? [{ kind: 'member', label: 'My membership', role: 'Member', where: '', index: -1, adminId: '' }] : [], chooser: 'ask' }); // another organization never sees ISGH's admins
  const access = stored ?? mockAccess;
  const settings = await getSignIn();
  // only what the chooser needs – never the whole admin list
  const dashboards = dashboardsFor(access, parsed.data.email, parsed.data.member, settings, today(), (id) => ZONE[id] ?? id);
  return NextResponse.json({ dashboards, chooser: settings.chooser });
}
