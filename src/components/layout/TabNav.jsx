import { BookOpen, Calendar, GitBranch, Bot } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';

export const TABS = [
  { id: 'catalog', label: 'Course Catalogue & Smart Assistant', short: 'Catalogue', icon: BookOpen },
  { id: 'schedule', label: 'Weekly Schedule & Ghost Calendar', short: 'Schedule', icon: Calendar },
  { id: 'skills', label: 'Skill Tree & Career Pathways', short: 'Skill Tree', icon: GitBranch },
  { id: 'advisor', label: 'StudyPlus AI Tutor', short: 'AI Tutor', icon: Bot },
];

export function TabNav() {
  const activeTab = usePlanStore((s) => s.activeTab);
  const setTab = usePlanStore((s) => s.setTab);

  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const i = TABS.findIndex((t) => t.id === activeTab);
    const next = TABS[(i + step + TABS.length) % TABS.length].id;
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <nav className="px-4 sm:px-6 pb-3 overflow-x-auto scrollbar-thin">
      <div role="tablist" aria-label="H-OS views" className="flex gap-2 min-w-max" onKeyDown={onKeyDown}>
        {TABS.map(({ id, label, short, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls={`view-${id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                active ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden />
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
