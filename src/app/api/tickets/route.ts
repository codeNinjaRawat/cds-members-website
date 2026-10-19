/**
 * POST /api/tickets – the website and member-portal "Ask or tell us" form. Validates with the shared PublicTicketSchema and
 * forwards to the BE: POST /public/helpdesk/tickets (the portal uses /member/helpdesk/tickets with the session) → a help-desk ticket routed by category.
 * A hidden field `website` is a honeypot (bots fill it). Mock mode: validates and returns a reference, stores nothing.
 */
import { NextResponse } from 'next/server';
import { apiCall, apiConfig } from '@/lib/api/client';
import { PublicTicketSchema } from '@/lib/community/work';
import { getWorkSettings } from '@/lib/content/loaders';

export async function POST(req: Request) {
  let json: Record<string, unknown>;
  try { json = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  if (typeof json?.website === 'string' && json.website) return NextResponse.json({ reference: 'T-0000' }, { status: 202 }); // honeypot: pretend
  const parsed = PublicTicketSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) }, { status: 422 });
  const s = await getWorkSettings();
  const cat = s.helpdesk.categories.find((c) => c.id === parsed.data.categoryId && c.onWebsite && !c.archived);
  if (!s.helpdesk.enabled || !s.helpdesk.websiteForms || !cat) return NextResponse.json({ error: 'category_closed' }, { status: 422 });
  if (apiConfig.useMock) return NextResponse.json({ reference: `T-${2000 + Math.floor(Math.random() * 7000)}` }, { status: 202 });
  try {
    // signed in as a member: the portal route (the API takes name, email and masjid from the record)
    let r = /(?:^|;\s*)ms_sid=/.test(req.headers.get('cookie') ?? '') ? await apiCall('POST', '/member/helpdesk/tickets', parsed.data) : null;
    if (!r || r.status === 401 || r.status === 403) r = await apiCall('POST', '/public/helpdesk/tickets', parsed.data);
    const b = (r.body ?? {}) as { reference?: string; error?: string; detail?: unknown };
    if (r.status >= 400) return NextResponse.json({ error: r.status === 429 ? 'too_many' : 'invalid_input', message: b.error, issues: b.detail }, { status: r.status });
    return NextResponse.json({ reference: b.reference ?? '' }, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
