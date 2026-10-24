import { usePlanStore } from '../../store/usePlanStore.js';
import { NEWCOMER_CAREERS, PROGRAMMES, ROUTE_KIND } from '../../brain/pathways.js';

/** Every bachelor programme, with the careers it can lead to (the reverse of Find your path). */
export function Programmes() {
  const setTab = usePlanStore((s) => s.setTab);
  const leadsTo = (id) =>
    NEWCOMER_CAREERS.flatMap((c) => c.routes.filter((r) => r.programme === id).map((r) => ({ career: c, kind: r.kind })));

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl w-full mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">All programmes</h2>
        <p className="text-slate-600 mt-1">Already have a programme in mind? See where it can take you.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(PROGRAMMES).map(([id, p]) => (
          <article key={id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
              <p className="text-sm text-slate-600">
                {p.track} · {p.years} years · {p.campus} · {p.language}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Can lead to</p>
              <ul className="flex flex-wrap gap-2">
                {leadsTo(id).map(({ career, kind }) => (
                  <li key={career.id}>
                    <button
                      onClick={() => setTab('paths')}
                      className="inline-flex items-center gap-1.5 text-sm bg-slate-50 border border-slate-200 hover:border-amber-500 rounded-full px-3 py-1"
                      title={`${ROUTE_KIND[kind].label} route`}
                    >
                      <span aria-hidden>{career.emoji}</span> {career.label}
                      <span className={`text-[11px] font-medium px-1.5 rounded-full ${ROUTE_KIND[kind].className}`}>{ROUTE_KIND[kind].label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Admission:</span> {p.entry.join(' · ')} · {p.intake}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
