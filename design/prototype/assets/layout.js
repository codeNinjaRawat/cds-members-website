/* W1 – public layout behavior. Renders header/footer from window.SITE (mock CMS) and wires accessibility.
   Maps 1:1 to future React components: <AnnouncementBar>, <SiteHeader>, <NavDropdown>, <MobileMenu>, <ThemeToggle>, <SiteFooter>, <NewsletterForm>. */
(function () {
  'use strict';
  const S = window.SITE;
  const doc = document, root = doc.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const flag = (k) => Boolean(S.flags && S.flags[k]);
  const icon = {
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
    auto: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor"><rect x="22" y="22" width="56" height="56"/><rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)"/></g></svg>',
  };

  /* ---------- Theme mode: system | light | dark ---------- */
  const mq = matchMedia('(prefers-color-scheme: dark)');
  function applyMode(pref) {
    root.dataset.mode = pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;
    root.dataset.modePref = pref;
    const b = doc.getElementById('modeBtn');
    if (b) {
      const label = { system: 'Theme: match device', light: 'Theme: light', dark: 'Theme: dark' }[pref];
      b.innerHTML = { system: icon.auto, light: icon.sun, dark: icon.moon }[pref] + `<span class="sr-only">${label}</span>`;
      b.title = label + ' (click to change)';
    }
  }
  const modeOrder = ['system', 'light', 'dark'];
  mq.addEventListener('change', () => { if (root.dataset.modePref === 'system') applyMode('system'); });

  /* ---------- Announcement ---------- */
  function renderAnnouncement() {
    const a = S.announcement, slot = doc.getElementById('announcement');
    if (!slot || !a || !flag('site.announcement')) return;
    const now = Date.now();
    if ((a.startsAt && now < Date.parse(a.startsAt)) || (a.endsAt && now > Date.parse(a.endsAt))) return;
    if (a.dismissible && store.get('dismissed:' + a.id) === '1') return;
    slot.outerHTML = `<div class="announce" id="announcement" role="region" aria-label="Announcement" data-tone="${esc(a.tone || 'info')}">
      <div class="wrap"><span>${esc(a.text)}</span>${a.link ? `<a href="${esc(a.link.href)}">${esc(a.link.label)}</a>` : ''}
      ${a.dismissible ? `<button class="icon-btn dismiss" type="button" aria-label="Dismiss announcement">${icon.close}</button>` : ''}</div></div>`;
    const el = doc.getElementById('announcement');
    const btn = el.querySelector('.dismiss');
    if (btn) btn.addEventListener('click', () => { store.set('dismissed:' + a.id, '1'); el.remove(); doc.getElementById('main')?.focus?.(); });
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    const slot = doc.getElementById('site-header');
    const variant = slot.dataset.variant || 'solid';
    const current = slot.dataset.current || '';
    const items = S.nav.map((item, i) => {
      if (!item.children) {
        return `<li><a class="nav-link" href="${esc(item.href)}"${item.label === current ? ' aria-current="page"' : ''}>${esc(item.label)}</a></li>`;
      }
      const links = item.children.map((c) => `<a href="${esc(c.href)}"><b>${esc(c.label)}</b><span>${esc(c.description || '')}</span></a>`).join('');
      return `<li><button class="nav-link" type="button" aria-expanded="false" aria-controls="dd-${i}">${esc(item.label)}${icon.chevron}</button>
        <div class="dropdown" id="dd-${i}" hidden>${links}</div></li>`;
    }).join('');
    slot.outerHTML = `<header class="site-header" id="site-header" data-variant="${esc(variant)}"><div class="wrap"><div class="nav-shell">
        <a class="brand" href="#">${icon.star}<span>${esc(S.org.productName)}</span></a>
        <nav aria-label="Main"><ul class="nav-list">${items}</ul></nav>
        <div class="header-actions">
          ${flag('site.themeToggle') ? '<button class="icon-btn" id="modeBtn" type="button"></button>' : ''}
          <a class="btn btn-outline btn-sm signin" href="${esc(S.actions.signIn.href)}">${esc(S.actions.signIn.label)}</a>
          <a class="btn btn-primary btn-sm join" href="${esc(S.actions.join.href)}">${esc(S.actions.join.label)}</a>
          <button class="icon-btn menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="mobileMenu">${icon.menu}<span class="sr-only">Open menu</span></button>
        </div></div></div></header>
      ${renderSheet()}`;
    wireDropdowns();
    wireSheet();
    const mb = doc.getElementById('modeBtn');
    if (mb) mb.addEventListener('click', () => {
      const next = modeOrder[(modeOrder.indexOf(root.dataset.modePref || 'system') + 1) % 3];
      store.set('isgh-mode', next); applyMode(next);
    });
    // Over-hero glass → solid after the hero leaves the viewport
    const header = doc.getElementById('site-header'), hero = doc.querySelector('[data-hero]');
    if (variant === 'over-hero' && hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => header.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-90px 0px 0px 0px' }).observe(hero);
    } else header.classList.add('is-solid');
  }

  function wireDropdowns() {
    const buttons = [...doc.querySelectorAll('.nav-list button[aria-controls]')];
    const close = (b, focus) => { b.setAttribute('aria-expanded', 'false'); doc.getElementById(b.getAttribute('aria-controls')).hidden = true; if (focus) b.focus(); };
    const open = (b) => { buttons.forEach((o) => o !== b && close(o)); b.setAttribute('aria-expanded', 'true'); doc.getElementById(b.getAttribute('aria-controls')).hidden = false; };
    buttons.forEach((b) => {
      const panel = doc.getElementById(b.getAttribute('aria-controls'));
      b.addEventListener('click', () => (b.getAttribute('aria-expanded') === 'true' ? close(b) : open(b)));
      b.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); open(b); panel.querySelector('a')?.focus(); } });
      panel.addEventListener('keydown', (e) => {
        const links = [...panel.querySelectorAll('a')], i = links.indexOf(doc.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
      });
      b.parentElement.addEventListener('focusout', (e) => { if (!b.parentElement.contains(e.relatedTarget)) close(b); });
    });
    doc.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const openBtn = buttons.find((b) => b.getAttribute('aria-expanded') === 'true');
      if (openBtn) close(openBtn, true);
    });
    doc.addEventListener('click', (e) => { buttons.forEach((b) => { if (!b.parentElement.contains(e.target)) close(b); }); });
  }

  function renderSheet() {
    const items = S.nav.map((item, i) => item.children
      ? `<li><button class="sheet-link" type="button" aria-expanded="false" aria-controls="ms-${i}">${esc(item.label)}${icon.chevron}</button>
           <div class="sub" id="ms-${i}" hidden>${item.children.map((c) => `<a href="${esc(c.href)}">${esc(c.label)}<span>${esc(c.description || '')}</span></a>`).join('')}</div></li>`
      : `<li><a class="sheet-link" href="${esc(item.href)}">${esc(item.label)}</a></li>`).join('');
    return `<div class="sheet" id="mobileMenu" role="dialog" aria-modal="true" aria-label="Menu" hidden>
      <div class="sheet-top"><a class="brand" href="#">${icon.star}<span>${esc(S.org.productName)}</span></a>
        <button class="icon-btn" id="sheetClose" type="button">${icon.close}<span class="sr-only">Close menu</span></button></div>
      <ul>${items}</ul>
      <div class="sheet-actions"><a class="btn btn-primary" href="${esc(S.actions.join.href)}">${esc(S.actions.join.label)}</a>
        <a class="btn btn-outline" href="${esc(S.actions.signIn.href)}">${esc(S.actions.signIn.label)}</a></div></div>`;
  }

  function wireSheet() {
    const sheet = doc.getElementById('mobileMenu'), openBtn = doc.getElementById('menuBtn'), closeBtn = doc.getElementById('sheetClose');
    const focusables = () => [...sheet.querySelectorAll('a, button')].filter((el) => el.offsetParent !== null);
    const open = () => { sheet.hidden = false; openBtn.setAttribute('aria-expanded', 'true'); doc.body.classList.add('locked'); closeBtn.focus(); };
    const close = () => { sheet.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); doc.body.classList.remove('locked'); openBtn.focus(); };
    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    sheet.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') { // focus trap
        const f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    sheet.querySelectorAll('button[aria-controls]').forEach((b) => b.addEventListener('click', () => {
      const ex = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!ex)); doc.getElementById(b.getAttribute('aria-controls')).hidden = ex;
    }));
    sheet.querySelectorAll('.sub a, a.sheet-link, .sheet-actions a').forEach((a) => a.addEventListener('click', close));
    matchMedia('(min-width: 1021px)').addEventListener('change', (e) => { if (e.matches && !sheet.hidden) close(); });
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    const slot = doc.getElementById('site-footer'), F = S.footer, O = S.org;
    const cols = F.columns.map((c) => `<div><h3>${esc(c.title)}</h3><ul>${c.links.map(([l, h]) => `<li><a href="${esc(h)}">${esc(l)}</a></li>`).join('')}</ul></div>`).join('');
    const nl = flag('cms.newsletter') ? `<div class="newsletter"><h3>${esc(F.newsletter.title)}</h3><p>${esc(F.newsletter.text)}</p>
      <form id="nlForm" novalidate>
        <div class="row"><label class="sr-only" for="nlEmail">Email address</label>
          <input class="input" id="nlEmail" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="nlMsg">
          <button class="btn" type="submit">Subscribe</button></div>
        <label class="check"><input type="checkbox" id="nlConsent"> <span>${esc(F.newsletter.consent)}</span></label>
        <p class="msg" id="nlMsg" aria-live="polite"></p>
      </form></div>` : '';
    slot.outerHTML = `<footer class="site-footer" id="site-footer"><div class="wrap">
      <div class="footer-top">
        <div class="footer-org"><h2>${esc(O.name)}</h2>
          <address>${O.address.map(esc).join('<br>')}<br><a href="tel:${esc(O.phone.tel)}">${esc(O.phone.display)}</a><br><a href="mailto:${esc(O.email)}">${esc(O.email)}</a></address>
          <div class="social">${F.social.map(([l, h]) => `<a href="${esc(h)}" rel="noopener" target="_blank">${esc(l)}<span class="sr-only"> (opens in a new tab)</span></a>`).join('')}</div></div>
        ${nl}
      </div>
      <div class="footer-cols">${cols}</div>
      <div class="footer-bottom"><p>© ${new Date().getFullYear()} ${esc(O.name)}. ${esc(O.taxNote)}</p>
        <ul>${F.legal.map(([l, h]) => `<li><a href="${esc(h)}">${esc(l)}</a></li>`).join('')}</ul></div>
      <div class="wordmark" aria-hidden="true">${esc(O.productName)}</div>
    </div></footer>`;
    const form = doc.getElementById('nlForm');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = doc.getElementById('nlEmail'), consent = doc.getElementById('nlConsent'), msg = doc.getElementById('nlMsg');
      const v = email.value.trim();
      email.removeAttribute('aria-invalid'); msg.className = 'msg';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { email.setAttribute('aria-invalid', 'true'); msg.className = 'msg error'; msg.textContent = 'Enter a valid email address, like name@example.com.'; email.focus(); return; }
      if (!consent.checked) { msg.className = 'msg error'; msg.textContent = 'Check the box to agree to receive emails.'; consent.focus(); return; }
      msg.className = 'msg ok'; msg.textContent = `Almost done. We sent a confirmation link to ${v}.`; form.reset();
    });
  }

  /* ---------- Boot ---------- */
  applyMode(store.get('isgh-mode') || 'system');
  renderAnnouncement();
  renderHeader();
  applyMode(root.dataset.modePref);
  renderFooter();
  window.ISGHLayout = { applyMode };
})();
