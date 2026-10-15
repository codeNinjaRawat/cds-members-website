/**
 * Runs before the page paints:
 *  1. applies the visitor's light/dark choice; if they never chose, the ADMIN default mode
 *     (site-config.theme.defaultMode) is used → no flash of wrong colors
 *  2. marks dismissed announcements on <html data-dismissed="id1 id2"> → no flash of a closed banner
 * Stored keys: "isgh-mode" = system | light | dark, "dismissed:<announcementId>" = "1"
 */
export const MODE_STORAGE_KEY = 'isgh-mode';
export type ModePref = 'system' | 'light' | 'dark';

export function makeModeScript(defaultMode: ModePref = 'system'): string {
  const def = ['system', 'light', 'dark'].includes(defaultMode) ? defaultMode : 'system';
  return `(function(){var r=document.documentElement;try{var p=localStorage.getItem('${MODE_STORAGE_KEY}')||'${def}';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);r.dataset.mode=d?'dark':'light';r.dataset.modePref=p;var ids=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('dismissed:')===0)ids.push(k.slice(10));}r.dataset.dismissed=ids.join(' ');}catch(e){r.dataset.mode='${def === 'dark' ? 'dark' : 'light'}';}})();`;
}

/** Back-compat default (device setting). */
export const modeScript = makeModeScript('system');
