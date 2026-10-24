import { BookOpen, Calendar, GitBranch, Bot, Users, ClipboardCheck, Database, CalendarRange } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';

/** Each role has its own set of views. */
export const ROLE_TABS = {
  student: [
    { id: 'catalog', label: 'Course Catalogue & Smart Assistant', short: 'Catalogue', icon: BookOpen },
    { id: 'schedule', label: 'Weekly Schedule & Ghost Calendar', short: 'Schedule', icon: Calendar },
    { id: 'skills', label: 'Skill Tree & Career Pathways', short: 'Skill Tree', icon: GitBranch },
    { id: 'advisor', label: 'StudyPlus AI Tutor', short: 'AI Tutor', icon: Bot },
  ],
  advisor: [
    { id: 'advisees', label: 'My Advisees', short: 'Advisees', icon: Users },
    { id: 'review', label: "Plan Review: Alex", short: 'Review', icon: ClipboardCheck },
    { id: 'reference', label: 'Course Catalogue (read-only)', short: 'Catalogue', icon: BookOpen },
  ],
  admin: [
    { id: 'courses', label: 'Course Data & Librarian', short: 'Course Data', icon: Database },
    { id: 'timetable', label: 'Department Timetable', short: 'Timetable', icon: CalendarRange },
  ],
};

const ACTIVE_STYLE = { student: 'bg-blue-600', advisor: 'bg-emerald-600', admin: 'bg-slate-800' };

/** The tab to render: falls back to the role's first view if the stored tab belongs to another role. */
export function useActiveTab() {
  const role = usePlanStore((s) => s.role);
  const activeTab = usePlanStore((s) => s.activeTab);
  const tabs = ROLE_TABS[role];
  return tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id;
}

export function TabNav() {
  const role = usePlanStore((s) => s.role);
  const activeTab = useActiveTab();
  const setTab = usePlanStore((s) => s.setTab);
  const TABS = ROLE_TABS[role];

  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const i = TABS.findIndex((t) => t.id === activeTab);
    const next = TABS[(i + step + TABS.length) % TABS.length].id;
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <nav data-tour="tabs" className="px-4 sm:px-6 pb-3 overflow-x-auto scrollbar-thin">
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
                active ? `${ACTIVE_STYLE[role]} text-white shadow-sm` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
