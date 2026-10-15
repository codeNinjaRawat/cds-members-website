/** Shown instead of the website when the address belongs to no organization, or the organization is paused/closed. */
export function TenantClosed({ name, reason, email }: { name?: string; reason: 'unknown' | 'suspended' | 'cancelled'; email?: string }) {
  const title = reason === 'unknown' ? 'This address is not in use' : reason === 'suspended' ? `${name} is temporarily unavailable` : `${name} has closed its membership site`;
  const text = reason === 'unknown' ? 'Check the spelling of the address. If you followed a link from your community, ask them for the right one.'
    : reason === 'suspended' ? 'Membership online is paused for now. Your membership and payments are safe. Please try again later.'
    : 'This site is no longer active.';
  return (
    <main className="tenant-closed" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px 16px', fontFamily: 'var(--font-public-sans), system-ui, sans-serif', background: '#F6F4EE', color: '#1B2420' }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-bricolage), system-ui, sans-serif', fontSize: '2rem', lineHeight: 1.15, margin: '0 0 12px' }}>{title}</h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.55, margin: 0 }}>{text}</p>
        {email && reason !== 'unknown' && <p style={{ marginTop: 16 }}>Questions? <a href={`mailto:${email}`} style={{ color: '#0E5A45' }}>{email}</a></p>}
      </div>
    </main>
  );
}
