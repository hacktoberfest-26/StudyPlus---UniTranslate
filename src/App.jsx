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

const VIEWS = {
  catalog: CourseCatalogue,
  schedule: ScheduleCalendar,
  skills: SkillTree,
  advisor: AdvisorChatbot,
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
  const tone = { success: 'bg-green-600', warning: 'bg-amber-600', info: 'bg-slate-800' };
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
  const activeTab = usePlanStore((s) => s.activeTab);
  const View = VIEWS[activeTab];

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <MobileCriticalStrip />
      <header className="bg-white border-b border-slate-200 shrink-0">
        <Header />
        <DegreeProgress />
        <RoleContextBar />
        <TabNav />
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <ProactiveAlerts />
        <main
          key={activeTab}
          id={`view-${activeTab}`}
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
      <ChatDrawer />
      <Toasts />
    </div>
  );
}
