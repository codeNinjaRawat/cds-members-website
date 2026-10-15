/* Design-review helper (NOT part of the website). Lets reviewers flip theme and admin flags via the panel or URL:
   ?theme=bayou|iznik|dusk&announce=off&newsletter=off&tone=warning */
(function () {
  const q = new URLSearchParams(location.search), S = window.SITE, root = document.documentElement;
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  root.dataset.theme = q.get('theme') || get('review-theme') || 'bayou';
  if (q.get('announce') === 'off') S.flags['site.announcement'] = false;
  if (q.get('newsletter') === 'off') S.flags['cms.newsletter'] = false;
  if (q.get('tone')) S.announcement.tone = q.get('tone');
  if (q.get('resetdismiss') === '1') { try { localStorage.removeItem('dismissed:' + S.announcement.id); } catch {} }
  window.addEventListener('DOMContentLoaded', () => {
    const d = document.createElement('details'); d.className = 'review-panel'; d.open = !matchMedia('(max-width: 600px)').matches;
    const btn = (label, on, fn) => `<button type="button" aria-pressed="${on}" data-fn="${fn}">${label}</button>`;
    const t = root.dataset.theme;
    d.innerHTML = `<summary>Review controls (not part of site)</summary>
      <p>Theme</p><div>${['bayou', 'iznik', 'dusk'].map((x) => btn(x[0].toUpperCase() + x.slice(1), t === x, 'theme:' + x)).join('')}</div>
      <p>Admin flags (simulated)</p><div>${btn('Announcement', S.flags['site.announcement'], 'flag:announce')}${btn('Newsletter', S.flags['cms.newsletter'], 'flag:newsletter')}${btn('Reset dismissed banner', false, 'reset')}</div>`;
    document.body.appendChild(d);
    d.addEventListener('click', (e) => {
      const f = e.target.dataset && e.target.dataset.fn; if (!f) return;
      const u = new URL(location.href);
      if (f.startsWith('theme:')) { set('review-theme', f.slice(6)); u.searchParams.set('theme', f.slice(6)); }
      if (f === 'flag:announce') u.searchParams.set('announce', S.flags['site.announcement'] ? 'off' : 'on');
      if (f === 'flag:newsletter') u.searchParams.set('newsletter', S.flags['cms.newsletter'] ? 'off' : 'on');
      if (f === 'reset') u.searchParams.set('resetdismiss', '1');
      location.href = u.toString();
    });
  });
})();
