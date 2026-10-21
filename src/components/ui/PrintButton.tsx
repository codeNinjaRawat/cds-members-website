'use client';
/** A real print button (no javascript: links). Print styles live in blocks.css. */
export function PrintButton({ label = 'Print' }: { label?: string }) {
  return <button type="button" className="btn btn-secondary btn-sm print-btn" onClick={() => window.print()}>{label}</button>;
}
