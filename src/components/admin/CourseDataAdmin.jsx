import { useMemo } from 'react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { CAMPUSES, FORMATS } from '../../brain/courses.js';
import { findConflicts, formatSchedule } from '../../librarian/schedule.js';
import { skillLabel } from '../../agents/planning.js';
import { LibrarianConsole } from '../layout/LibrarianConsole.jsx';
import { TypeChip } from '../ui/primitives.jsx';
import { useColumnWidths, ResizableTh, ResetColumnsButton, ResizableBox } from '../ui/resize.jsx';

const RECORD_COLUMNS = [
  ['code', 'Code', 90],
  ['course', 'Course', 220],
  ['type', 'Type', 120],
  ['cfu', 'CFU', 70],
  ['schedule', 'Schedule & room', 200],
  ['campus', 'Campus / format', 150],
  ['prereqs', 'Prerequisites', 170],
  ['source', 'Source', 170],
];
const RECORD_DEFAULTS = Object.fromEntries(RECORD_COLUMNS.map(([id, , w]) => [id, w]));

/** Admin view of the Brain's course records, with the Librarian ingestion pipeline on top. */
export function CourseDataAdmin() {
  const catalog = usePlanStore((s) => s.catalog);
  const cols = useColumnWidths('course-records', RECORD_DEFAULTS);
  const clashCodes = useMemo(() => new Set(findConflicts(catalog).flatMap(({ a, b }) => [a.code, b.code])), [catalog]);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Course Data & Librarian</h2>
        <p className="text-sm text-slate-600">
          Manage the course records every student and advisor sees. Admins maintain the catalogue; they cannot see or edit individual study plans.
        </p>
      </div>

      <div data-tour="ingest">
        <LibrarianConsole />
      </div>

      <ResizableBox
        id="course-records-table"
        label="Course records table"
        minWidth={320}
        minHeight={200}
        innerClassName="bg-white border border-slate-200 rounded-xl"
      >
        <section data-tour="course-table" aria-label="Course records">
          <table className="table-fixed text-sm [&_td]:break-words" style={{ width: cols.total, minWidth: '100%' }}>
            <caption className="text-left px-4 pt-4 pb-2">
              <span className="font-semibold text-slate-900">Course records</span>
              <span className="text-xs text-slate-500"> · {catalog.length} courses published to the catalogue · drag column edges to resize </span>
              <ResetColumnsButton cols={cols} />
            </caption>
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {RECORD_COLUMNS.map(([id, label]) => (
                  <ResizableTh key={id} id={id} label={label} cols={cols} className={id === 'cfu' ? 'text-right' : 'text-left'} />
                ))}
              </tr>
            </thead>
            <tbody>
              {catalog.map((c) => (
                <tr key={c.code} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-600 truncate">{c.code}</td>
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
                  <td className="px-3 py-2.5 text-xs text-slate-700">
                    {c.prerequisites.length ? c.prerequisites.map(skillLabel).join(', ') : 'None'}
                  </td>
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
      </ResizableBox>
    </div>
  );
}
