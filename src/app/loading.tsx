import { LoaderMark } from '@/components/ui/SmartLoader';

/** Shown at once while the next page loads (header and footer stay), so a click never looks stuck. */
export default function Loading() {
  return <div className="route-loading wrap" role="status" aria-live="polite"><LoaderMark size={40} /><p>Opening…</p></div>;
}
