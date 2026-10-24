import { Bookmark, BookmarkCheck, Clock, MapPin, Languages, CalendarDays } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { PROGRAMMES, ROUTE_KIND } from '../../brain/pathways.js';

/** One way to reach a career: the programme, a year-by-year timeline and what you need to apply. */
export function RouteCard({ career, route, index, compact = false }) {
  const key = `${career.id}:${index}`;
  const saved = usePlanStore((s) => s.shortlist.includes(key));
  const toggleShortlist = usePlanStore((s) => s.toggleShortlist);
  const programme = PROGRAMMES[route.programme];
  const kind = ROUTE_KIND[route.kind];

  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${kind.className}`}>{kind.label}</span>
            <span className="text-xs font-semibold text-slate-600">{route.fit}</span>
          </div>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">
            {programme.name} <span className="font-normal text-slate-600">· {programme.track}</span>
          </h4>
          {compact && <p className="text-sm text-slate-600">Leads to: {career.label}</p>}
        </div>
        <button
          onClick={() => toggleShortlist(key)}
          aria-pressed={saved}
          className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border ${
            saved ? 'bg-amber-50 border-amber-400 text-amber-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {saved ? <BookmarkCheck className="w-4 h-4" aria-hidden /> : <Bookmark className="w-4 h-4" aria-hidden />}
          {saved ? 'Saved' : 'Save route'}
        </button>
      </header>

      {/* Timeline: each stage of study, ending in the career */}
      <ol className="flex flex-col md:flex-row md:items-stretch gap-2" aria-label="Route timeline">
        {route.steps.map((step) => (
          <li key={step.label} className="flex md:flex-col md:flex-1 gap-2 items-stretch">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{step.label}</p>
              <p className="text-sm font-medium text-slate-900">{step.focus}</p>
              <ul className="mt-1 text-xs text-slate-600 space-y-0.5">
                {step.courses.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
        <li className="md:w-40 flex items-center justify-center bg-amber-50 border border-amber-300 rounded-xl p-3 text-center">
          <span className="text-sm font-semibold text-amber-900">
            <span aria-hidden>{career.emoji} </span>
            {career.label}
          </span>
        </li>
      </ol>

      {!compact && <p className="text-sm text-slate-700">{route.note}</p>}

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <li className="flex gap-1.5">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
          <div>
            <p className="text-slate-500">Duration</p>
            <p className="text-slate-900 font-medium">{route.duration}</p>
          </div>
        </li>
        <li className="flex gap-1.5">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
          <div>
            <p className="text-slate-500">Campus</p>
            <p className="text-slate-900 font-medium">{programme.campus}</p>
          </div>
        </li>
        <li className="flex gap-1.5">
          <Languages className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
          <div>
            <p className="text-slate-500">Taught in</p>
            <p className="text-slate-900 font-medium">{programme.language}</p>
          </div>
        </li>
        <li className="flex gap-1.5">
          <CalendarDays className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
          <div>
            <p className="text-slate-500">Intake</p>
            <p className="text-slate-900 font-medium">{programme.intake}</p>
          </div>
        </li>
      </ul>
      <p className="text-xs text-slate-600">
        <span className="font-semibold text-slate-700">To apply you need:</span> {programme.entry.join(' · ')}
      </p>
    </article>
  );
}
