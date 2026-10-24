import { useMemo, useState } from 'react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { CAMPUSES, COURSE_TYPES } from '../../brain/courses.js';
import { findConflicts, formatHour } from '../../librarian/schedule.js';
import { WeekGrid } from '../schedule/WeekGrid.jsx';

/** Every course in the catalogue on one week, so the admin can spot slot clashes between courses. */
export function DepartmentTimetable() {
  const catalog = usePlanStore((s) => s.catalog);
  const [campus, setCampus] = useState('');

  const courses = useMemo(() => catalog.filter((c) => !campus || c.campus === campus), [catalog, campus]);
  const clashes = useMemo(() => findConflicts(courses), [courses]);

  return (
    <div>
      <div className="bg-white border-b border-slate-200 p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Department Timetable</h2>
          <p className="text-sm text-slate-600">All {catalog.length} catalogue courses in one week. Red zones are slots where two courses are scheduled at the same time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-slate-600">Campus</span>
            <select
              id="timetable-campus"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All campuses</option>
              {Object.entries(CAMPUSES).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {Object.entries(COURSE_TYPES).map(([id, t]) => (
            <span key={id} className="flex items-center gap-1.5 text-slate-600">
              <span className={`w-3.5 h-3.5 rounded ${t.block} type-${id}`} aria-hidden /> {t.label}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <section className="bg-white border border-slate-200 rounded-xl p-4" aria-label="Slot clashes">
          <h3 className="font-semibold text-slate-900">Slot clashes · {clashes.length}</h3>
          {clashes.length ? (
            <ul className="mt-2 space-y-1.5">
              {clashes.map(({ a, b, windows }) => {
                const mustChoose = a.type === 'compulsory' || b.type === 'compulsory';
                return (
                  <li key={`${a.code}-${b.code}`} className="text-sm text-slate-700">
                    <strong>{a.title}</strong> and <strong>{b.title}</strong> both run{' '}
                    {windows.map((w) => `${w.day} ${formatHour(w.start)}-${formatHour(w.end)}`).join(', ')}.
                    {mustChoose && (
                      <span className="block text-xs text-amber-700">
                        One of them is compulsory, so students who want the other must drop it. Consider moving the elective to another slot.
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-green-700 mt-1">No two courses share a slot.</p>
          )}
        </section>

        <div className="overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label="Department weekly timetable">
          <WeekGrid courses={courses} tourId="dept-timetable" collisionLabel="⚠️ Slot clash" />
        </div>
      </div>
    </div>
  );
}
