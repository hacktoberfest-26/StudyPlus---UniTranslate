import { Compass, ListChecks, LifeBuoy } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { NEWCOMER_CAREERS, PROGRAMMES } from '../../brain/pathways.js';
import { RouteCard } from './RouteCard.jsx';

/** Routes the newcomer saved, with the concrete next steps to apply. */
export function Shortlist() {
  const shortlist = usePlanStore((s) => s.shortlist);
  const setTab = usePlanStore((s) => s.setTab);
  const openPanel = usePlanStore((s) => s.openPanel);
  const toast = usePlanStore((s) => s.toast);

  const saved = shortlist
    .map((key) => {
      const [careerId, index] = key.split(':');
      const career = NEWCOMER_CAREERS.find((c) => c.id === careerId);
      return career && career.routes[Number(index)] ? { key, career, route: career.routes[Number(index)], index: Number(index) } : null;
    })
    .filter(Boolean);
  const programmes = [...new Set(saved.map((s) => s.route.programme))].map((id) => PROGRAMMES[id]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl w-full mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My shortlist</h2>
        <p className="text-slate-600 mt-1">The routes you saved, and what to do next.</p>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <Compass className="w-10 h-10 mx-auto text-amber-600" aria-hidden />
          <p className="text-slate-700">You haven’t saved any routes yet. Pick a career and tap “Save route” on the ones you like.</p>
          <button onClick={() => setTab('paths')} className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Find your path
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem] items-start">
          <div className="space-y-4">
            {saved.map(({ key, career, route, index }) => (
              <RouteCard key={key} career={career} route={route} index={index} compact />
            ))}
          </div>
          <aside className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 lg:sticky lg:top-[calc(var(--sticky-top)+1rem)]" aria-label="Next steps">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <ListChecks className="w-4 h-4" aria-hidden /> Next steps
            </h3>
            <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-5">
              <li>Check the admission requirements for {programmes.length === 1 ? 'this programme' : `these ${programmes.length} programmes`}.</li>
              <li>Book the admission test (TOLC or the programme’s own test).</li>
              <li>Come to an open day and talk to current students.</li>
              <li>Apply before the deadline: {programmes.map((p) => `${p.name} – ${p.intake.split('· ')[1]}`).join('; ')}.</li>
            </ol>
            <button
              onClick={() => toast('Applications open in the real service. This prototype stops here.')}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium py-2 rounded-lg"
            >
              Start my application
            </button>
            <button
              onClick={() => openPanel('help', 'contact')}
              className="w-full inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-sm font-medium py-2 rounded-lg"
            >
              <LifeBuoy className="w-4 h-4" aria-hidden /> Talk to an orientation advisor
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
