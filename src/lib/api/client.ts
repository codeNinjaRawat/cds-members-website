/**
 * Server-side client for the Masajid Solutions API (BE).
 *   ISGH_USE_MOCK_API=true (default) → demo mode: nothing here is called, the demo store answers.
 *   ISGH_USE_MOCK_API=false          → every page and form goes to ISGH_API_URL.
 * Every call carries who the visitor is talking to: `x-org-host` (the address they used), `x-client-ip` and the shared
 * `x-edge-key` (MS_EDGE_KEY = the API's EDGE_KEY) – without the key the API ignores those headers. Member calls also
 * pass the visitor's session cookie (ms_sid) through; the browser never talks to the API directly.
 */
import 'server-only';
import { headers } from 'next/headers';

export const apiConfig = {
  baseUrl: (process.env.ISGH_API_URL ?? 'http://localhost:4330').replace(/\/$/, ''),
  useMock: (process.env.ISGH_USE_MOCK_API ?? 'true') === 'true',
  revalidate: Number(process.env.ISGH_CONFIG_REVALIDATE_SECONDS ?? 60),
  timeoutMs: Number(process.env.ISGH_API_TIMEOUT_MS ?? 8000),
};

export class ApiError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The address the visitor used (behind nginx: x-forwarded-host) – decides the organization. */
export function visitorHost(h: Headers): string {
  return (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0].trim().toLowerCase();
}
/** The visitor's IP: the last hop our own nginx added (anything to the left can be made up). */
export function visitorIp(h: Headers): string {
  const hops = (h.get('x-forwarded-for') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return hops[hops.length - 1] ?? h.get('x-real-ip') ?? '';
}
/** Headers for one API call made on behalf of this request (`session`: pass the member's cookie through). */
export function edgeHeaders(h: Headers, session = false): Record<string, string> {
  // MS_ORG_HOST (development against a shared server): the organization address to present – e.g. isgh.nextgrow.pro –
  // because this PC's own address (isgh.localhost) means nothing to the server. Unset everywhere else.
  const out: Record<string, string> = { accept: 'application/json', 'x-org-host': process.env.MS_ORG_HOST || visitorHost(h) };
  if (process.env.MS_EDGE_KEY) out['x-edge-key'] = process.env.MS_EDGE_KEY;
  if (process.env.MS_ORG && !out['x-org-host']) out['x-org'] = process.env.MS_ORG;           // one fixed organization (a single-tenant install)
  const ip = visitorIp(h); if (ip) out['x-client-ip'] = ip;
  const ua = h.get('user-agent'); if (ua) out['user-agent'] = ua.slice(0, 300);
  if (session) { const sid = (h.get('cookie') ?? '').match(/(?:^|;\s*)ms_sid=([^;]+)/); if (sid) out.cookie = `ms_sid=${sid[1]}`; }
  return out;
}
const requestHeaders = async () => { try { return await headers(); } catch { return new Headers(); } };   // build time: no request

/** Cached read of public content (one cache entry per organization address). */
export async function apiGet<T = unknown>(path: string, tags: string[] = [], opts: { session?: boolean } = {}): Promise<T> {
  const h = await requestHeaders(); const eh = edgeHeaders(h, opts.session);
  const sep = path.includes('?') ? '&' : '?';
  const url = `${apiConfig.baseUrl}${path}${opts.session ? '' : `${sep}for=${encodeURIComponent(eh['x-org-host'] ?? '')}`}`;
  const res = await fetch(url, {
    headers: opts.session ? eh : Object.fromEntries(Object.entries(eh).filter(([k]) => k !== 'x-client-ip' && k !== 'user-agent')),   // cached: nothing per visitor
    signal: AbortSignal.timeout(apiConfig.timeoutMs),
    ...(opts.session ? { cache: 'no-store' as const } : { next: { revalidate: apiConfig.revalidate, tags } }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(`GET ${path} failed (${res.status})${body && typeof body === 'object' && 'error' in body ? `: ${String((body as { error: unknown }).error)}` : ''}`, res.status, body);   // the server's reason shows on the error page
  return body as T;
}

/** A write on behalf of the visitor (session cookie passed through). Throws ApiError with the API's answer. */
export async function apiPost<T = unknown>(path: string, body: unknown, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'): Promise<T> {
  const r = await apiCall(method, path, body);
  if (r.status >= 400) throw new ApiError(`${method} ${path} failed`, r.status, r.body);
  return r.body as T;
}

/** The raw answer (status, JSON, Set-Cookie) – for routes that pass the API's answer straight back. */
export async function apiCall(method: string, path: string, body?: unknown): Promise<{ status: number; body: unknown; setCookie: string[] }> {
  const h = await requestHeaders();
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method, cache: 'no-store', signal: AbortSignal.timeout(apiConfig.timeoutMs),
    headers: { ...edgeHeaders(h, true), ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null), setCookie: res.headers.getSetCookie?.() ?? [] };
}
