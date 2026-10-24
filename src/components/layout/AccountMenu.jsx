import { useEffect, useRef, useState } from 'react';
import { ChevronDown, User, Bell, Globe, Shield, Accessibility, Compass, LifeBuoy, Bug, RotateCcw, LogOut, CalendarSync } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { ROLES } from '../../brain/student.js';

const AVATAR = { newcomer: 'bg-amber-700', student: 'bg-blue-600', advisor: 'bg-emerald-700', admin: 'bg-ink-800' };

/** Signed-in account menu: profile, settings, display, help and sign out. */
export function AccountMenu() {
  const session = usePlanStore((s) => s.session);
  const role = usePlanStore((s) => s.role);
  const openPanel = usePlanStore((s) => s.openPanel);
  const startTour = usePlanStore((s) => s.startTour);
  const resetDemo = usePlanStore((s) => s.resetDemo);
  const signOut = usePlanStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...wrapRef.current.querySelectorAll('[role="menuitem"]')];
        const i = items.indexOf(document.activeElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    wrapRef.current?.querySelector('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!session) return null;
  const initials = session.name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const act = (fn) => () => {
    setOpen(false);
    fn();
  };
  const groups = [
    [
      ['Account & profile', User, () => openPanel('settings', 'account')],
      ['Notifications', Bell, () => openPanel('settings', 'notifications')],
      ['Language & region', Globe, () => openPanel('settings', 'language')],
      ['Calendar sync', CalendarSync, () => openPanel('settings', 'calendar')],
      ['Privacy & data', Shield, () => openPanel('settings', 'privacy')],
      ['Display & accessibility', Accessibility, () => openPanel('display')],
    ],
    [
      ['Guided tour', Compass, startTour],
      ['Help & contact', LifeBuoy, () => openPanel('help', 'contact')],
      ['Report a bug', Bug, () => openPanel('help', 'bug')],
    ],
    [
      ['Reset demo data', RotateCcw, resetDemo],
      ['Sign out', LogOut, signOut],
    ],
  ];

  return (
    <div ref={wrapRef} className="relative" data-tour="account-menu">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={`w-8 h-8 rounded-full ${AVATAR[role]} text-white text-sm font-semibold flex items-center justify-center`} aria-hidden>
          {initials || '?'}
        </span>
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-sm font-medium text-slate-900">{session.name}</span>
          <span className="block text-xs text-slate-500">{ROLES[role].label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div role="menu" aria-label="Account" className="view-enter absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="font-semibold text-slate-900 truncate">{session.name}</p>
            <p className="text-xs text-slate-500 truncate">{session.email}</p>
            <p className="text-xs text-slate-500">{ROLES[role].label}</p>
          </div>
          {groups.map((items, gi) => (
            <div key={gi} className={gi ? 'border-t border-slate-100 mt-1 pt-1' : 'pt-1'}>
              {items.map(([label, Icon, fn]) => (
                <button
                  key={label}
                  role="menuitem"
                  onClick={act(fn)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-slate-100 focus:bg-slate-100 focus:outline-none ${
                    label === 'Sign out' ? 'text-red-700' : 'text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden /> {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
