/**
 * Generic loader for public, admin-controlled data from the BE.
 * Mock mode or any BE/validation problem → returns the mock (site never breaks) and logs.
 */
import 'server-only';
import type { ZodType, ZodTypeDef } from 'zod';
import { apiConfig, apiGet } from './client';
import { readDemoStore, type DemoStoreKey } from './demo-store';

export async function loadPublic<T>(path: string, schema: ZodType<T, ZodTypeDef, unknown>, mock: T, tags: string[], storeKey?: DemoStoreKey): Promise<T> {
  if (apiConfig.useMock) return (storeKey && (await readDemoStore(storeKey, schema, mock))) || mock; // admin demo publish (no BE yet)
  try {
    const parsed = schema.safeParse(await apiGet(path, tags));
    if (parsed.success) return parsed.data;
    console.error(`[api] ${path} returned invalid data – using fallback`, parsed.error.flatten());
  } catch (err) {
    console.error(`[api] ${path} unavailable – using fallback`, err);
  }
  return mock;
}
