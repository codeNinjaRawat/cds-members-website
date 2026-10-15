'use client';
/**
 * Site-wide announcement – admin: CMS › Announcements (text, tone, link, schedule, dismissible)
 * + feature flag "site.announcement". Dismissal is remembered per announcement id in this browser.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Announcement } from '@/lib/site-config/schema';
import { dismissKey, isWithinWindow } from '@/lib/site-config/announcement';
import { t } from '@/content/en-US/common';
import { CloseIcon } from './icons';


export function AnnouncementBar({ announcement }: { announcement: Announcement }) {
  const [hidden, setHidden] = useState(false);

  // Re-check the schedule in the browser (the page may be cached longer than the window)
  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(dismissKey(announcement.id)) === '1'; } catch { /* storage unavailable */ }
    if (dismissed || !isWithinWindow(announcement)) setHidden(true);
  }, [announcement]);

  if (hidden) return null;

  const dismiss = () => {
    try { localStorage.setItem(dismissKey(announcement.id), '1'); } catch { /* storage unavailable */ }
    setHidden(true);
    document.getElementById('main')?.focus();
  };

  return (
    <div className="announce" id="announcement" role="region" aria-label={t.announcement}
         data-tone={announcement.tone} data-announce-id={announcement.id}>
      <div className="wrap">
        <span>{announcement.text}</span>
        {announcement.link && <Link href={announcement.link.href}>{announcement.link.label}</Link>}
        {announcement.dismissible && (
          <button className="icon-btn dismiss" type="button" aria-label={t.dismissAnnouncement} onClick={dismiss}>
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
