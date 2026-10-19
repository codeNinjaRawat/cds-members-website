'use client';
/**
 * Live mode in the browser (ISGH_USE_MOCK_API=false at build time → NEXT_PUBLIC_LIVE_API=1).
 * Everything goes to this website's own /api/be/* door; the session cookie is httpOnly, so the browser only keeps a
 * copy of the member's home for quick rendering (sessionStorage, cleared when the tab closes) – the API decides.
 */
export const LIVE = process.env.NEXT_PUBLIC_LIVE_API === '1';

export type LiveAnswer<T> = { ok: true; status: number; data: T } | { ok: false; status: number; message: string; data: Record<string, unknown> };

/** Call the API through /api/be (path without the leading slash, e.g. "member/portal"). Never throws. */
export async function be<T = unknown>(method: string, path: string, body?: unknown): Promise<LiveAnswer<T>> {
  try {
    const r = await fetch(`/api/be/${path}`, { method, credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? undefined : { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (r.ok) return { ok: true, status: r.status, data: data as T };
    return { ok: false, status: r.status, data, message: String(data.error ?? data.message ?? (r.status === 429 ? 'Too many tries – please wait a few minutes.' : 'Something went wrong. Please try again.')) };
  } catch {
    return { ok: false, status: 0, data: {}, message: 'We could not reach the server. Check your connection and try again.' };
  }
}
