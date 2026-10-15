'use client';
/**
 * "Continue with Google" (follows Google's sign-in button branding: white button, standard "G" mark, the words
 * "Continue with Google"). DEMO: opens a labeled picker with sample accounts instead of calling Google.
 */
import { useEffect, useRef, useState } from 'react';
import { DEMO_GOOGLE_ACCOUNTS, googleSignIn } from '@/lib/demo/demo-service';

export type GoogleProfile = Awaited<ReturnType<typeof googleSignIn>>;

const GLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export function GoogleButton({ onProfile, disabled }: { onProfile: (p: GoogleProfile) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const choose = async (a: (typeof DEMO_GOOGLE_ACCOUNTS)[number]) => {
    setBusy(a.email);
    const p = await googleSignIn(a);
    setBusy(null); setOpen(false); onProfile(p);
  };

  return (
    <>
      <button type="button" className="btn-google" onClick={() => setOpen(true)} disabled={disabled}>
        <GLogo /><span>Continue with Google</span>
      </button>
      <dialog ref={dialogRef} className="g-dialog" aria-labelledby="g-title" onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="g-inner">
          <p className="g-demo">Demo – no Google account is used</p>
          <h2 id="g-title">Choose an account</h2>
          <p className="g-sub">to continue to ISGH Members</p>
          <ul>
            {DEMO_GOOGLE_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button type="button" onClick={() => void choose(a)} disabled={!!busy}>
                  <span className="g-avatar" aria-hidden="true">{a.firstName[0]}</span>
                  <span><b>{a.firstName} {a.lastName}</b><small>{a.email}</small></span>
                  {busy === a.email && <span className="g-spin" aria-label="Signing in" />}
                </button>
              </li>
            ))}
          </ul>
          <p className="g-fine">Google shares your name, email address and profile picture with ISGH. We never see your Google password.</p>
          <button type="button" className="linkish" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </dialog>
    </>
  );
}
