/**
 * Loader for admin-controlled content.
 *   Demo mode → the demo store (admin Publish) or the built-in content.
 *   API mode  → GET /site/documents/{key}: the organization's own document or its starter content. When the API cannot
 *               answer we show an error page rather than another organization's content (the built-in mock is ISGH's).
 */
import 'server-only';
import type { ZodType, ZodTypeDef } from 'zod';
import { ApiError, apiConfig, apiGet } from './client';
import { readDemoStore, type DemoStoreKey } from './demo-store';

/** One website document from the API (API mode only), validated with the shared schema. */
export async function siteDoc<T>(key: DemoStoreKey, schema?: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  const r = await apiGet<{ data: unknown }>(`/site/documents/${key}`, [`doc:${key}`]);
  if (!schema) return r.data as T;
  const parsed = schema.safeParse(r.data);
  if (parsed.success) return parsed.data;
  console.error(`[api] ${key} does not match the website's schema`, parsed.error.flatten().fieldErrors);
  throw new ApiError(`${key}: invalid document`, 502);
}

export async function loadPublic<T>(path: string, schema: ZodType<T, ZodTypeDef, unknown>, mock: T, tags: string[], storeKey?: DemoStoreKey): Promise<T> {
  if (apiConfig.useMock) return (storeKey && (await readDemoStore(storeKey, schema, mock))) || mock; // admin demo publish (no BE yet)
  if (!storeKey) throw new ApiError(`${path}: no document key`, 500);
  return siteDoc(storeKey, schema);
}
