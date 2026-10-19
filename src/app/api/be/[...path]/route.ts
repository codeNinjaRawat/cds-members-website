/**
 * /api/be/* – the browser's door to the API in live mode (ISGH_USE_MOCK_API=false). Same origin, so the session
 * cookie (ms_sid, httpOnly) belongs to this website's address. Only sign-in, public and member routes pass;
 * admin and platform routes never go through the website. Writes must come from this site (Origin check).
 */
import { apiCall, apiConfig } from '@/lib/api/client';

const ALLOWED = /^(auth|public|member)\/[A-Za-z0-9._~\-/]{1,300}$/;
type Ctx = { params: Promise<{ path: string[] }> };

const sameSite = (req: Request) => {
  const o = req.headers.get('origin'); if (!o) return true;
  const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').split(',')[0].trim();
  return o === `https://${host}` || o === `http://${host}` || o === new URL(req.url).origin;
};
/** The API's cookie, re-issued for this website (no Domain – the browser keeps it for this address only). */
const ownCookie = (c: string) => c.split(';').map((x) => x.trim()).filter((x) => !/^domain=/i.test(x)).join('; ');

async function pass(req: Request, { params }: Ctx) {
  if (apiConfig.useMock) return Response.json({ message: 'Demo mode – the API is not connected.' }, { status: 404 });
  const path = (await params).path.join('/');
  if (!ALLOWED.test(path) || path.includes('..')) return Response.json({ message: 'Not found.' }, { status: 404 });
  if (req.method !== 'GET' && !sameSite(req)) return Response.json({ message: 'Not allowed from another site.' }, { status: 403 });
  let body: unknown;
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    const text = await req.text();
    if (text.length > 1_000_000) return Response.json({ message: 'Too large.' }, { status: 413 });
    try { body = text ? JSON.parse(text) : {}; } catch { return Response.json({ message: 'Invalid request.' }, { status: 400 }); }
  }
  const q = new URL(req.url).search;
  try {
    const r = await apiCall(req.method, `/${path}${q}`, body);
    const out = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
    for (const c of r.setCookie) out.append('set-cookie', ownCookie(c));
    return new Response(JSON.stringify(r.body ?? {}), { status: r.status, headers: out });
  } catch {
    return Response.json({ message: 'We could not reach the server. Please try again in a minute.' }, { status: 503 });
  }
}
export { pass as GET, pass as POST, pass as PUT, pass as PATCH, pass as DELETE };
