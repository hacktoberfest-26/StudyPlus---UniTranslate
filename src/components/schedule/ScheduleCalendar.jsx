import { useMemo } from 'react';
import { Eye, Plus } from 'lucide-react';
import { WeekGrid } from './WeekGrid.jsx';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useCatalogIndex, usePlanCourses } from '../../store/derived.js';
import { COURSE_TYPES } from '../../brain/courses.js';
import { formatSchedule, conflictsWith } from '../../librarian/schedule.js';

export function ScheduleCalendar() {
  const scheduleMode = usePlanStore((s) => s.scheduleMode);
  const setScheduleMode = usePlanStore((s) => s.setScheduleMode);
  const ghostCode = usePlanStore((s) => s.ghostCode);
  const hoverGhostCode = usePlanStore((s) => s.hoverGhostCode);
  const setHoverGhost = usePlanStore((s) => s.setHoverGhost);
  const previewCourse = usePlanStore((s) => s.previewCourse);
  const clearGhost = usePlanStore((s) => s.clearGhost);
  const addCourse = usePlanStore((s) => s.addCourse);
  const removeCourse = usePlanStore((s) => s.removeCourse);
  const catalog = usePlanStore((s) => s.catalog);
  const index = useCatalogIndex();
  const planCourses = usePlanCourses();

  const isDraft = scheduleMode === 'draft';
  const shown = useMemo(() => (isDraft ? planCourses : planCourses.filter((c) => c.status === 'confirmed')), [isDraft, planCourses]);
  const asGhost = (code) => (isDraft && index[code] && !planCourses.some((c) => c.code === code) ? index[code] : null);
  // Hovering overlays a ghost without touching the layout; the banner only reflects the pinned ghost.
  const pinned = asGhost(ghostCode);
  const ghost = asGhost(hoverGhostCode) ?? pinned;
  const pinnedClashes = pinned ? conflictsWith(pinned, planCourses) : [];
  const pickable = catalog.filter((c) => !planCourses.some((p) => p.code === c.code));

  const totalCfu = shown.reduce((s, c) => s + c.cfu, 0);

  return (
    <div className="flex flex-col">
      <div className="bg-white border-b border-slate-200 p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Weekly Timetable</h2>
          <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1" role="radiogroup" aria-label="View mode" data-tour="view-mode">
            <span className="text-xs text-slate-500 px-2">View Mode:</span>
            {[
              ['confirmed', 'Confirmed Schedule'],
              ['draft', 'Draft Preview'],
            ].map(([id, label]) => (
              <button
                key={id}
                role="radio"
                aria-checked={scheduleMode === id}
                onClick={() => setScheduleMode(id)}
                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  scheduleMode === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            {shown.length} courses · {totalCfu} CFU
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {Object.entries(COURSE_TYPES).map(([id, t]) => (
            <span key={id} className="flex items-center gap-1.5 text-slate-600">
              <span className={`w-3.5 h-3.5 rounded ${t.block} type-${id}`} aria-hidden /> {t.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3.5 h-3.5 rounded ghost-block" aria-hidden /> Ghost
          </span>
        </div>
      </div>

      {pinned && (
        <div
          className={`px-4 py-2 flex flex-wrap items-center gap-2 text-sm border-b ${
            pinnedClashes.length ? 'bg-red-50 border-red-200 text-red-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
          role="status"
        >
          <Eye className="w-4 h-4" aria-hidden />
          <span>
            Previewing <strong>{pinned.title}</strong> ({formatSchedule(pinned)}) —{' '}
            {pinnedClashes.length ? `🔥 collides with ${pinnedClashes.map((c) => c.title).join(', ')}` : '✅ no collision with your draft'}
          </span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => addCourse(pinned.code)} className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
              <Plus className="w-3.5 h-3.5" aria-hidden /> Add to Draft
            </button>
            <button onClick={clearGhost} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-current/30 hover:bg-white">
              Clear preview
            </button>
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col xl:flex-row xl:items-start gap-4">
        <div className="flex-1 min-w-0">
          <WeekGrid courses={shown} ghost={ghost} onRemove={removeCourse} tourId="calendar" />
        </div>

        <aside className="xl:w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-3 self-start w-full xl:sticky xl:top-[calc(var(--sticky-top)+1rem)]" aria-label="Ghost preview picker" data-tour="ghost-picker">
          <h3 className="text-sm font-semibold text-slate-900">👻 Ghost Preview</h3>
          {isDraft ? (
            <>
              <p className="text-xs text-slate-500 mb-2">Hover a course to overlay it on your week; click to pin it.</p>
              <ul className="space-y-1" onMouseLeave={() => setHoverGhost(null)}>
                {pickable.map((c) => {
                  const clash = conflictsWith(c, planCourses).length > 0;
                  return (
                    <li key={c.code}>
                      <button
                        onMouseEnter={() => setHoverGhost(c.code)}
                        onFocus={() => setHoverGhost(c.code)}
                        onBlur={() => setHoverGhost(null)}
                        onClick={() => previewCourse(c.code)}
                        aria-pressed={ghostCode === c.code}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                          ghostCode === c.code ? 'border-indigo-400 bg-indigo-50' : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-800 truncate">{c.title}</span>
                          <span className={clash ? 'text-red-600' : 'text-green-600'}>{clash ? '🔥' : '✓'}</span>
                        </span>
                        <span className="text-slate-500">{formatSchedule(c)} · {c.cfu} CFU</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Showing only confirmed enrolments.{' '}
              <button onClick={() => setScheduleMode('draft')} className="text-blue-600 hover:underline">
                Switch to Draft Preview
              </button>{' '}
              to see draft courses and ghost-test new ones.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
