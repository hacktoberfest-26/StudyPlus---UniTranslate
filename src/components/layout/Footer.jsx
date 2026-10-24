import { usePlanStore } from '../../store/usePlanStore.js';

/** Site footer: always offers a way to get help, report a problem and adjust the display. */
export function Footer() {
  const openPanel = usePlanStore((s) => s.openPanel);
  const link = 'hover:text-slate-900 hover:underline underline-offset-2';
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-sm text-slate-600">
        <p>© 2026 UniTranslate · Prototype</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <button onClick={() => openPanel('help', 'contact')} className={link}>
            Help & contact
          </button>
          <button onClick={() => openPanel('help', 'bug')} className={link}>
            Report a bug
          </button>
          <button onClick={() => openPanel('help', 'faq')} className={link}>
            FAQ
          </button>
          <button onClick={() => openPanel('display')} className={link}>
            Display & accessibility
          </button>
        </nav>
      </div>
    </footer>
  );
}
