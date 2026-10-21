'use client';
/** Members-only page content: shown after sign-in (same session the member portal uses); otherwise a sign-in prompt. */
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { getSessionEmail, SESSION_EVENT } from '@/lib/demo/demo-member';

export function MembersGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking');
  useEffect(() => {
    const read = () => setState(getSessionEmail() ? 'in' : 'out');
    read();
    window.addEventListener(SESSION_EVENT, read);
    return () => window.removeEventListener(SESSION_EVENT, read);
  }, []);
  if (state === 'in') return <>{children}</>;
  return (
    <div className="members-gate" aria-live="polite">
      <b>For members</b>
      <p>{state === 'checking' ? 'Checking your sign-in…' : 'Sign in with your member email to read this page.'}</p>
      {state === 'out' && <Link className="btn btn-primary" href={`/sign-in?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}>Sign in</Link>}
    </div>
  );
}
