/**
 * Thin server-side client for the ISGH BE API.
 * - All public content/settings come from the BE (admin-controlled).
 * - Responses are cached with Next.js revalidation (ISGH_CONFIG_REVALIDATE_SECONDS) and tagged,
 *   so the BE can call our revalidate endpoint when an admin publishes a change (planned).
 */
import 'server-only';

export const apiConfig = {
  baseUrl: process.env.ISGH_API_URL ?? 'http://localhost:4000',
  useMock: (process.env.ISGH_USE_MOCK_API ?? 'true') === 'true',
  revalidate: Number(process.env.ISGH_CONFIG_REVALIDATE_SECONDS ?? 60),
  timeoutMs: 4000,
};

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiGet<T = unknown>(path: string, tags: string[] = []): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  try {
    const res = await fetch(`${apiConfig.baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate: apiConfig.revalidate, tags },
    });
    if (!res.ok) throw new ApiError(`GET ${path} failed`, res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  try {
    const res = await fetch(`${apiConfig.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new ApiError(`POST ${path} failed`, res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
