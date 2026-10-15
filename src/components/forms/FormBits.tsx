/** Small shared form pieces for feedback / complaint / verify (demo forms). */
import type { ReactNode } from 'react';

export function FField({ id, label, hint, error, optional, children }: { id: string; label: string; hint?: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className={`jf-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}{optional && <span className="opt"> (optional)</span>}</label>
      {hint && <p className="hint" id={`${id}-hint`}>{hint}</p>}
      {children}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}
export const aria = (id: string, hint?: boolean, error?: string) => ({
  'aria-invalid': error ? true : undefined,
  'aria-describedby': [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined,
});
export function DemoNote({ children }: { children: ReactNode }) {
  return <p className="jf-test">{children}</p>;
}
