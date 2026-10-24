import { useMemo, useState } from 'react';
import { Search, Scale, X } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { CAMPUSES, FORMATS, DAYS } from '../../brain/courses.js';
import { CourseCard } from './CourseCard.jsx';

const selectClass =
  'bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export function CourseCatalogue() {
  const catalog = usePlanStore((s) => s.catalog);
  const compareCodes = usePlanStore((s) => s.compareCodes);
  const openCompare = usePlanStore((s) => s.openCompare);
  const clearCompare = usePlanStore((s) => s.clearCompare);

  const [query, setQuery] = useState('');
  const [campus, setCampus] = useState('');
  const [format, setFormat] = useState('');
  const [cfu, setCfu] = useState('');
  const [days, setDays] = useState([]);

  const cfuOptions = useMemo(() => [...new Set(catalog.map((c) => c.cfu))].sort((a, b) => a - b), [catalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter(
      (c) =>
        (!q || [c.title, c.code, c.lecturer].some((v) => v.toLowerCase().includes(q))) &&
        (!campus || c.campus === campus) &&
        (!format || c.format === format) &&
        (!cfu || c.cfu === Number(cfu)) &&
        (!days.length || c.sessions.some((s) => days.includes(s.day))),
    );
  }, [catalog, query, campus, format, cfu, days]);

  const toggleDay = (d) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const hasFilters = query || campus || format || cfu || days.length;

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="bg-white border-b border-slate-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="relative flex-1 min-w-0">
            <span className="sr-only">Search courses</span>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, code or lecturer…"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="grid grid-cols-3 gap-2 md:flex">
            <select aria-label="Campus" value={campus} onChange={(e) => setCampus(e.target.value)} className={selectClass}>
              <option value="">All Campuses</option>
              {Object.entries(CAMPUSES).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select aria-label="Teaching format" value={format} onChange={(e) => setFormat(e.target.value)} className={selectClass}>
              <option value="">All Formats</option>
              {Object.entries(FORMATS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select aria-label="CFU credits" value={cfu} onChange={(e) => setCfu(e.target.value)} className={selectClass}>
              <option value="">All CFU</option>
              {cfuOptions.map((v) => (
                <option key={v} value={v}>
                  {v} CFU
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Schedule days">
          <span className="text-xs font-medium text-slate-500">Schedule days:</span>
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              aria-pressed={days.includes(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                days.includes(d) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'
              }`}
            >
              {d}
            </button>
          ))}
          {hasFilters ? (
            <button
              onClick={() => {
                setQuery('');
                setCampus('');
                setFormat('');
                setCfu('');
                setDays([]);
              }}
              className="text-xs text-blue-600 hover:underline ml-1"
            >
              Clear filters
            </button>
          ) : null}
          <span className="ml-auto text-xs text-slate-500">
            {filtered.length} of {catalog.length} courses
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
        {filtered.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filtered.map((course) => (
              <CourseCard key={course.code} course={course} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500 py-16">No courses match these filters.</p>
        )}
      </div>

      {compareCodes.length > 0 && (
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <Scale className="w-4 h-4 text-indigo-600" aria-hidden />
          <span className="text-sm text-slate-700">
            <strong>{compareCodes.length}</strong>/3 selected: {compareCodes.join(', ')}
          </span>
          <div className="flex gap-2 ml-auto mr-16 sm:mr-20">
            <button onClick={clearCompare} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 px-2">
              <X className="w-4 h-4" aria-hidden /> Clear
            </button>
            <button
              onClick={openCompare}
              disabled={compareCodes.length < 2}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {compareCodes.length < 2 ? 'Select 1 more' : `⚖️ Compare ${compareCodes.length} courses`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
