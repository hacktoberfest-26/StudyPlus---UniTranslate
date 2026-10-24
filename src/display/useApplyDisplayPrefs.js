import { useEffect, useState } from 'react';
import { usePrefsStore } from '../store/usePrefsStore.js';

const TEXT_SIZES = { normal: '100%', large: '112.5%', larger: '125%' };

/**
 * "System" follows the viewer's own theme: an explicit data-theme on <html> (set by
 * some hosts) wins, otherwise the OS colour-scheme preference.
 */
function useSystemDark() {
  const read = () => {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDark(read());
    mq.addEventListener('change', update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mq.removeEventListener('change', update);
      mo.disconnect();
    };
  }, []);
  return dark;
}

/** Applies the display preferences as classes on <html>, where the CSS in index.css picks them up. */
export function useApplyDisplayPrefs() {
  const prefs = usePrefsStore();
  const systemDark = useSystemDark();
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.classList.toggle('cvd-safe', prefs.colorVision === 'safe');
    root.classList.toggle('hc', prefs.highContrast);
    root.classList.toggle('reduce-motion', prefs.reduceMotion);
    root.classList.toggle('font-readable', prefs.readableFont);
    root.style.fontSize = TEXT_SIZES[prefs.textSize] ?? '100%';
  }, [dark, prefs.colorVision, prefs.highContrast, prefs.reduceMotion, prefs.readableFont, prefs.textSize]);

  return dark;
}
