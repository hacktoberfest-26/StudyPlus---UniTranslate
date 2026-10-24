import { useMemo } from 'react';
import { X, Eye, Plus } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useCatalogIndex, usePlanCourses } from '../../store/derived.js';
import { DAYS, CAMPUSES, COURSE_TYPES } from '../../brain/courses.js';
import { dayLabel, formatHour, formatSchedule, sessionsOverlap, overlapWindow, conflictsWith } from '../../librarian/schedule.js';

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_PX = 60;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

/** Places overlapping events side by side: returns events with `lane` and `lanes`. */
function layoutDay(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  let cluster = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    const laneEnds = [];
    const placed = cluster.map((ev) => {
      let lane = laneEnds.findIndex((end) => end <= ev.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = ev.end;
      return { ...ev, lane };
    });
    placed.forEach((ev) => out.push({ ...ev, lanes: laneEnds.length }));
    cluster = [];
  };
  for (const ev of sorted) {
    if (cluster.length && ev.start >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = cluster.length === 1 ? ev.end : Math.max(clusterEnd, ev.end);
  }
  if (cluster.length) flush();
  return out;
}

function collisionZones(events) {
  const zones = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (sessionsOverlap(events[i], events[j])) {
        const w = overlapWindow(events[i], events[j]);
        if (!zones.some((z) => z.start === w.start && z.end === w.end)) zones.push(w);
      }
    }
  }
  return zones;
}

function EventBlock({ ev, onRemove }) {
  const { course, ghost, status } = ev;
  const top = (ev.start - START_HOUR) * HOUR_PX;
  const height = (ev.end - ev.start) * HOUR_PX;
  const width = 100 / ev.lanes;
  const color = COURSE_TYPES[course.type]?.block ?? 'bg-slate-500';

  return (
    <div
      className="absolute p-0.5"
      style={{ top, height, left: `${ev.lane * width}%`, width: `${width}%` }}
    >
      <div
        className={`h-full rounded-lg p-2 text-xs overflow-hidden relative ${
          ghost ? 'ghost-block text-indigo-800' : `${color} text-white shadow-sm ${status === 'draft' ? 'ring-2 ring-offset-1 ring-white/70 border-2 border-dashed border-white/60' : ''}`
        }`}
      >
        <p className="font-semibold leading-tight pr-4">{course.title}</p>
        <p className="opacity-90">{ev.room}</p>
        <p className="opacity-80">
          {CAMPUSES[course.campus]?.short} · {course.cfu} CFU
        </p>
        <p className="opacity-80 font-medium">{ghost ? '👻 Ghost preview' : status === 'draft' ? 'Draft' : 'Confirmed'}</p>
        {!ghost && status === 'draft' && (
          <button
            onClick={() => onRemove(course.code)}
            className="absolute top-1 right-1 p-0.5 rounded hover:bg-white/25"
            aria-label={`Remove ${course.title} from draft`}
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

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

  const days = useMemo(() => {
    const events = [
      ...shown.flatMap((course) => course.sessions.map((s, i) => ({ key: `${course.code}-${i}`, course, status: course.status, ...s }))),
      ...(ghost ? ghost.sessions.map((s, i) => ({ key: `ghost-${ghost.code}-${i}`, course: ghost, ghost: true, ...s })) : []),
    ];
    return DAYS.map((day) => {
      const dayEvents = events.filter((e) => e.day === day);
      return { day, events: layoutDay(dayEvents), zones: collisionZones(dayEvents) };
    });
  }, [shown, ghost]);

  const totalCfu = shown.reduce((s, c) => s + c.cfu, 0);

  return (
    <div className="flex flex-col min-h-0 h-full">
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
              <span className={`w-3.5 h-3.5 rounded ${t.block}`} aria-hidden /> {t.label}
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

      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin p-4 flex flex-col xl:flex-row gap-4">
        <div className="flex-1 overflow-x-auto scrollbar-thin">
          <div data-tour="calendar" className="min-w-[720px] bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-slate-200 bg-slate-50">
              <div />
              {DAYS.map((d) => (
                <div key={d} className="p-2 text-center text-sm font-semibold text-slate-700 border-l border-slate-200">
                  {dayLabel(d)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[56px_repeat(5,1fr)]">
              <div className="relative" style={{ height: HOURS.length * HOUR_PX }}>
                {HOURS.map((h) => (
                  <div key={h} className="absolute w-full text-right pr-2 text-xs text-slate-400 -translate-y-1/2" style={{ top: (h - START_HOUR) * HOUR_PX }}>
                    {h === START_HOUR ? '' : formatHour(h)}
                  </div>
                ))}
                <div className="absolute w-full text-right pr-2 text-xs text-slate-400 top-1">{formatHour(START_HOUR)}</div>
              </div>
              {days.map(({ day, events, zones }) => (
                <div
                  key={day}
                  className="relative border-l border-slate-200"
                  style={{
                    height: HOURS.length * HOUR_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, #e2e8f0 ${HOUR_PX - 1}px, #e2e8f0 ${HOUR_PX}px)`,
                  }}
                  aria-label={`${dayLabel(day)}: ${events.map((e) => e.course.title).join(', ') || 'free'}`}
                >
                  {events.map((ev) => (
                    <EventBlock key={ev.key} ev={ev} onRemove={removeCourse} />
                  ))}
                  {zones.map((z) => (
                    <div
                      key={`${z.start}-${z.end}`}
                      className="collision-flash absolute inset-x-0 z-20 pointer-events-none flex items-end justify-center rounded-md border-2 border-red-600"
                      style={{ top: (z.start - START_HOUR) * HOUR_PX, height: (z.end - z.start) * HOUR_PX }}
                      role="alert"
                    >
                      <span className="mb-1 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">🔥 Schedule Collision!</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="xl:w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-3 self-start w-full" aria-label="Ghost preview picker" data-tour="ghost-picker">
          <h3 className="text-sm font-semibold text-slate-900">👻 Ghost Preview</h3>
          {isDraft ? (
            <>
              <p className="text-xs text-slate-500 mb-2">Hover a course to overlay it on your week; click to pin it.</p>
              <ul className="space-y-1 max-h-72 xl:max-h-[480px] overflow-y-auto scrollbar-thin" onMouseLeave={() => setHoverGhost(null)}>
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
