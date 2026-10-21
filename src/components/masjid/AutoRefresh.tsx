'use client';
/** Reloads the page every N seconds (lobby screens) – a real reload, so times, events and announcements stay current. */
import { useEffect } from 'react';
export function AutoRefresh({ seconds }: { seconds: number }) {
  useEffect(() => { const t = setTimeout(() => window.location.reload(), seconds * 1000); return () => clearTimeout(t); }, [seconds]);
  return null;
}
