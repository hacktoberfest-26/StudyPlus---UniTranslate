import { BookOpen, Calendar, Target, Bot, Users, ClipboardCheck, Database, CalendarRange, House, Compass, School, Bookmark, Inbox } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';

/** Each role has its own set of views. */
export const ROLE_TABS = {
  newcomer: [
    { id: 'paths', label: 'Find your path', short: 'Find your path', icon: Compass },
    { id: 'programmes', label: 'All programmes', short: 'Programmes', icon: School },
    { id: 'shortlist', label: 'My shortlist', short: 'Shortlist', icon: Bookmark },
  ],
  student: [
    { id: 'home', label: 'Home', short: 'Home', icon: House },
    { id: 'catalog', label: 'Explore courses', short: 'Courses', icon: BookOpen },
    { id: 'schedule', label: 'My week', short: 'My week', icon: Calendar },
    { id: 'skills', label: 'Start from a goal', short: 'Goals', icon: Target },
    { id: 'advisor', label: 'Ask the tutor', short: 'Tutor', icon: Bot },
  ],
  advisor: [
    { id: 'advisees', label: 'My Advisees', short: 'Advisees', icon: Users },
    { id: 'review', label: "Plan Review: Alex", short: 'Review', icon: ClipboardCheck },
    { id: 'reference', label: 'Course Catalogue (read-only)', short: 'Catalogue', icon: BookOpen },
  ],
  admin: [
    { id: 'courses', label: 'Course Data & Librarian', short: 'Course Data', icon: Database },
    { id: 'timetable', label: 'Department Timetable', short: 'Timetable', icon: CalendarRange },
    { id: 'reports', label: 'Reports & feedback', short: 'Reports', icon: Inbox },
  ],
};

const ACTIVE_STYLE = { newcomer: 'bg-amber-700', student: 'bg-blue-600', advisor: 'bg-emerald-700', admin: 'bg-ink-800' };

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
    <nav data-tour="tabs" className="px-4 sm:px-6 py-2 overflow-x-auto scrollbar-thin">
      <div role="tablist" aria-label="Sections" className="flex gap-2 min-w-max" onKeyDown={onKeyDown}>
        {TABS.map(({ id, label, short, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls={active ? 'main-content' : undefined}
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
