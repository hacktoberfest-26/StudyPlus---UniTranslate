import { BookOpen, Target, Calendar, Bot, ArrowRight, ShieldCheck } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useAlerts } from '../../store/derived.js';
import { AlertCard } from '../alerts/ProactiveAlerts.jsx';
import { DegreeProgress } from '../layout/DegreeProgress.jsx';
import { RoleContextBar } from '../layout/RoleContextBar.jsx';

const ENTRY_POINTS = [
  {
    tab: 'catalog',
    title: 'Explore a course',
    text: 'Browse this semester’s courses, read syllabi and compare them side by side.',
    Icon: BookOpen,
    accent: 'bg-blue-600',
  },
  {
    tab: 'skills',
    title: 'Start from a goal',
    text: 'Pick the career you want and see which courses lead there.',
    Icon: Target,
    accent: 'bg-amber-600',
  },
  {
    tab: 'schedule',
    title: 'Plan my week',
    text: 'See your timetable and try courses before adding them.',
    Icon: Calendar,
    accent: 'bg-emerald-700',
  },
  {
    tab: 'advisor',
    title: 'Ask the tutor',
    text: 'Questions about courses, clashes or careers? Ask in plain words.',
    Icon: Bot,
    accent: 'bg-purple-600',
  },
];

/** Student landing page: four clear starting points, then what needs attention. */
export function StudentHome() {
  const name = usePlanStore((s) => s.session?.name ?? 'Alex');
  const setTab = usePlanStore((s) => s.setTab);
  const alerts = useAlerts();
  const attention = alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning');

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl w-full mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Hi {name.split(' ')[0]}, what would you like to do?</h2>
        <p className="text-slate-600 mt-1">Year 3 · Fall semester</p>
      </div>

      <nav aria-label="Start here" data-tour="entry-points" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ENTRY_POINTS.map(({ tab, title, text, Icon, accent }) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className="group text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className={`inline-flex w-10 h-10 rounded-xl ${accent} text-white items-center justify-center`} aria-hidden>
              <Icon className="w-5 h-5" />
            </span>
            <span className="mt-3 flex items-center justify-between gap-2 text-lg font-semibold text-slate-900">
              {title}
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" aria-hidden />
            </span>
            <span className="mt-1 block text-sm text-slate-600">{text}</span>
          </button>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <section className="bg-white border border-slate-200 rounded-2xl p-4" data-tour="attention" aria-labelledby="attention-title">
          <h3 id="attention-title" className="font-semibold text-slate-900 mb-3">
            {attention.length ? `Needs your attention · ${attention.length}` : 'Your plan'}
          </h3>
          {attention.length ? (
            <ul className="space-y-3">
              {attention.slice(0, 3).map((a) => (
                <AlertCard key={a.id} alert={a} />
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-green-800 bg-green-50 rounded-lg px-3 py-2">
              <ShieldCheck className="w-4 h-4" aria-hidden /> No clashes or missing requirements. You can submit your plan.
            </p>
          )}
          {attention.length > 3 && (
            <button onClick={() => setTab('catalog')} className="mt-3 text-sm font-medium text-blue-600 hover:underline">
              See all {attention.length} alerts
            </button>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden" data-tour="semester" aria-label="Your degree and this semester">
          <DegreeProgress />
          <div className="pt-1">
            <RoleContextBar />
          </div>
        </section>
      </div>
    </div>
  );
}
