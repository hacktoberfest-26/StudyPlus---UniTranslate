import { useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { INTERESTS, NEWCOMER_CAREERS, PROGRAMMES, ROUTE_KIND } from '../../brain/pathways.js';
import { RouteCard } from './RouteCard.jsx';

/**
 * Newcomer landing view: start from a career and see every route that leads there.
 * Interests narrow the list; picking a career shows its routes and a comparison table.
 */
export function PathFinder() {
  const [interests, setInterests] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(NEWCOMER_CAREERS[0].id);
  const detailRef = useRef(null);

  const careers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NEWCOMER_CAREERS.map((c) => ({ ...c, matches: c.interests.filter((i) => interests.includes(i)).length }))
      .filter((c) => !interests.length || c.matches > 0)
      .filter((c) => !q || [c.label, c.summary, ...c.skills].some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => b.matches - a.matches);
  }, [interests, query]);

  const selected = NEWCOMER_CAREERS.find((c) => c.id === selectedId);
  const toggleInterest = (id) => setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const choose = (id) => {
    setSelectedId(id);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: 'start' }));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl w-full mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Where do you want to be in a few years?</h2>
        <p className="text-slate-600 mt-1">Pick a career you like. We’ll show you every programme that can get you there, year by year.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" data-tour="interests" aria-label="Filter careers">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">What do you enjoy? Pick any.</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i.id}
                onClick={() => toggleInterest(i.id)}
                aria-pressed={interests.includes(i.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  interests.includes(i.id) ? 'bg-amber-700 border-amber-700 text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-amber-500'
                }`}
              >
                {i.label}
              </button>
            ))}
            {interests.length > 0 && (
              <button onClick={() => setInterests([])} className="text-sm text-blue-600 hover:underline px-2">
                Clear
              </button>
            )}
          </div>
        </fieldset>
        <label className="relative block">
          <span className="sr-only">Search careers</span>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            id="career-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a job or skill, e.g. designer, finance, Python"
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </section>

      <section aria-label="Careers" data-tour="career-grid">
        {careers.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {careers.map((c) => (
              <button
                key={c.id}
                onClick={() => choose(c.id)}
                aria-pressed={selectedId === c.id}
                className={`text-left bg-white border-2 rounded-2xl p-4 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedId === c.id ? 'border-amber-500 shadow-md' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-lg font-semibold text-slate-900">
                    <span aria-hidden>{c.emoji} </span>
                    {c.label}
                  </span>
                  {interests.length > 0 && c.matches > 0 && <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">Matches you</span>}
                </span>
                <span className="mt-1 block text-sm text-slate-600">{c.summary}</span>
                <span className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{c.demand}</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{c.salary} starting</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {c.routes.length} way{c.routes.length > 1 ? 's' : ''} to get there
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-6 text-center">No careers match. Try fewer interests or another word.</p>
        )}
      </section>

      {selected && (
        <section ref={detailRef} className="space-y-4 scroll-mt-24" aria-labelledby="career-title" data-tour="routes">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div>
              <h3 id="career-title" className="text-xl font-bold text-slate-900">
                <span aria-hidden>{selected.emoji} </span>
                {selected.label}
              </h3>
              <p className="text-slate-700 mt-1">{selected.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.skills.map((s) => (
                  <span key={s} className="text-xs font-medium bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">A typical week</h4>
              <ul className="mt-1 text-sm text-slate-700 space-y-1">
                {selected.dayToDay.map((d) => (
                  <li key={d}>• {d}</li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-900">
            {selected.routes.length} ways to become {/^[aeiou]/i.test(selected.label) ? 'an' : 'a'} {selected.label}
          </h3>
          {selected.routes.map((route, i) => (
            <RouteCard key={`${selected.id}-${i}`} career={selected} route={route} index={i} />
          ))}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto" tabIndex={0} role="region" aria-label="Compare the routes">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="text-left font-semibold text-slate-900 px-4 pt-4 pb-2">Compare the routes</caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="text-left font-medium px-4 py-2">Programme</th>
                  <th scope="col" className="text-left font-medium px-4 py-2">Route</th>
                  <th scope="col" className="text-left font-medium px-4 py-2">Duration</th>
                  <th scope="col" className="text-left font-medium px-4 py-2">Campus</th>
                  <th scope="col" className="text-left font-medium px-4 py-2">Admission</th>
                </tr>
              </thead>
              <tbody>
                {selected.routes.map((r, i) => {
                  const p = PROGRAMMES[r.programme];
                  return (
                    <tr key={i} className="border-t border-slate-100 align-top">
                      <th scope="row" className="text-left font-medium text-slate-900 px-4 py-2.5">
                        {p.name}
                        <span className="block text-xs font-normal text-slate-500">{p.track}</span>
                      </th>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROUTE_KIND[r.kind].className}`}>{ROUTE_KIND[r.kind].label}</span>
                        <span className="block text-xs text-slate-600 mt-1">{r.fit}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{r.duration}</td>
                      <td className="px-4 py-2.5 text-slate-700">{p.campus}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-700">{p.entry.slice(1).join(' · ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
