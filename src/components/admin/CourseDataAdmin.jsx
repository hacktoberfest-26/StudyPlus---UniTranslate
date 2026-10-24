import { useMemo } from 'react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { CAMPUSES, FORMATS } from '../../brain/courses.js';
import { findConflicts, formatSchedule } from '../../librarian/schedule.js';
import { skillLabel } from '../../agents/planning.js';
import { LibrarianConsole } from '../layout/LibrarianConsole.jsx';
import { TypeChip } from '../ui/primitives.jsx';

/** Admin view of the Brain's course records, with the Librarian ingestion pipeline on top. */
export function CourseDataAdmin() {
  const catalog = usePlanStore((s) => s.catalog);
  const clashCodes = useMemo(() => new Set(findConflicts(catalog).flatMap(({ a, b }) => [a.code, b.code])), [catalog]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Course Data & Librarian</h2>
        <p className="text-sm text-slate-600">
          Manage the course records every student and advisor sees. Admins maintain the catalogue; they cannot see or edit individual study plans.
        </p>
      </div>

      <div data-tour="ingest">
        <LibrarianConsole />
      </div>

      <section tabIndex={0} className="bg-white border border-slate-200 rounded-xl overflow-x-auto scrollbar-thin" data-tour="course-table" aria-label="Course records">
        <table className="w-full min-w-[880px] text-sm">
          <caption className="text-left px-4 pt-4 pb-2">
            <span className="font-semibold text-slate-900">Course records</span>
            <span className="text-xs text-slate-500"> · {catalog.length} courses published to the catalogue</span>
          </caption>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Code', 'Course', 'Type', 'CFU', 'Schedule & room', 'Campus / format', 'Prerequisites', 'Source'].map((h) => (
                <th key={h} scope="col" className={`font-medium px-3 py-2 ${h === 'CFU' ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.map((c) => (
              <tr key={c.code} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">{c.code}</td>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.lecturer}</p>
                </td>
                <td className="px-3 py-2.5">
                  <TypeChip type={c.type} />
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{c.cfu}</td>
                <td className="px-3 py-2.5 text-slate-700">
                  {formatSchedule(c)}
                  <span className="block text-xs text-slate-500">{c.sessions.map((s) => s.room).join(', ')}</span>
                  {clashCodes.has(c.code) && <span className="block text-xs font-medium text-amber-700">⚠️ Shares a slot with another course</span>}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700">
                  {CAMPUSES[c.campus]?.short} · {FORMATS[c.format]}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700">{c.prerequisites.length ? c.prerequisites.map(skillLabel).join(', ') : 'None'}</td>
                <td className="px-3 py-2.5 text-xs">
                  {c.source === 'brain' ? (
                    <span className="text-slate-500">Brain record</span>
                  ) : (
                    <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">Ingested · {c.source}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
