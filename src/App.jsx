import { useEffect } from 'react';
import { usePlanStore } from './store/usePlanStore.js';
import { useAlerts } from './store/derived.js';
import { Header } from './components/layout/Header.jsx';
import { RoleContextBar } from './components/layout/RoleContextBar.jsx';
import { DegreeProgress } from './components/layout/DegreeProgress.jsx';
import { TabNav } from './components/layout/TabNav.jsx';
import { ProactiveAlerts } from './components/alerts/ProactiveAlerts.jsx';
import { CourseCatalogue } from './components/catalogue/CourseCatalogue.jsx';
import { ComparisonDrawer } from './components/catalogue/ComparisonDrawer.jsx';
import { SyllabusModal } from './components/catalogue/SyllabusModal.jsx';
import { ScheduleCalendar } from './components/schedule/ScheduleCalendar.jsx';
import { SkillTree } from './components/skills/SkillTree.jsx';
import { AdvisorChatbot, ChatDrawer } from './components/chat/AdvisorChatbot.jsx';
import { ConfirmChangeDialog } from './components/alerts/ConfirmChangeDialog.jsx';
import { GuidedTour } from './components/tour/GuidedTour.jsx';
import { AdviseesDashboard } from './components/advisor/AdviseesDashboard.jsx';
import { PlanReview } from './components/advisor/PlanReview.jsx';
import { CourseDataAdmin } from './components/admin/CourseDataAdmin.jsx';
import { DepartmentTimetable } from './components/admin/DepartmentTimetable.jsx';
import { useActiveTab } from './components/layout/TabNav.jsx';
import { useApplyDisplayPrefs } from './display/useApplyDisplayPrefs.js';

const VIEWS = {
  // Student
  catalog: CourseCatalogue,
  schedule: ScheduleCalendar,
  skills: SkillTree,
  advisor: AdvisorChatbot,
  // Academic advisor
  advisees: AdviseesDashboard,
  review: PlanReview,
  reference: CourseCatalogue,
  // Department admin
  courses: CourseDataAdmin,
  timetable: DepartmentTimetable,
};

/** On small screens the alert panel scrolls away, so critical alerts are also pinned here. */
function MobileCriticalStrip() {
  const critical = useAlerts().filter((a) => a.severity === 'critical');
  const runAlertAction = usePlanStore((s) => s.runAlertAction);
  if (!critical.length) return null;
  const first = critical[0];
  const swap = first.actions.find((a) => a.kind === 'swap');

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-red-600 text-white px-4 py-2 flex items-center gap-3 shadow" role="alert">
      <p className="text-xs font-medium flex-1">
        🚨 {critical.length} timetable overlap{critical.length > 1 ? 's' : ''}: {first.message}
      </p>
      {swap && (
        <button onClick={() => runAlertAction(swap)} className="shrink-0 bg-white text-red-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
          ⚡ Fix
        </button>
      )}
    </div>
  );
}

function Toasts() {
  const toasts = usePlanStore((s) => s.toasts);
  const tone = { success: 'bg-green-700', warning: 'bg-amber-700', info: 'bg-ink-800' };
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 w-[min(92vw,28rem)] pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`view-enter ${tone[t.tone] ?? tone.info} text-white text-sm px-4 py-2 rounded-lg shadow-lg text-center`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  useApplyDisplayPrefs();
  const role = usePlanStore((s) => s.role);
  const activeTab = useActiveTab();
  const View = VIEWS[activeTab];
  const isStudent = role === 'student';
  const tourSeen = usePlanStore((s) => !!s.toursDone[s.role]);
  const startTour = usePlanStore((s) => s.startTour);

  // First visit to a workspace: open its guided tour (it can be skipped on the first card).
  useEffect(() => {
    if (!tourSeen) startTour();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {isStudent && <MobileCriticalStrip />}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <Header />
        {isStudent && <DegreeProgress />}
        {isStudent ? <RoleContextBar /> : <div className="h-3" />}
        <TabNav />
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {isStudent && <ProactiveAlerts />}
        <main
          key={activeTab}
          tabIndex={-1}
          id="main-content"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className={`view-enter flex-1 min-w-0 min-h-[70vh] lg:min-h-0 flex flex-col ${activeTab === 'advisor' ? 'p-0 sm:p-4' : ''}`}
        >
          {activeTab === 'advisor' ? (
            <div className="flex-1 min-h-[70vh] lg:min-h-0 sm:rounded-xl overflow-hidden border border-slate-200 max-w-3xl w-full mx-auto flex flex-col">
              <View />
            </div>
          ) : (
            <View />
          )}
        </main>
      </div>

      <ComparisonDrawer />
      <SyllabusModal />
      {isStudent && <ChatDrawer />}
      <ConfirmChangeDialog />
      <GuidedTour />
      <Toasts />
    </div>
  );
}
