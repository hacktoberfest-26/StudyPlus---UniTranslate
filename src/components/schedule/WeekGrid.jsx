/**
 * Read-only Mon–Fri 08:00–18:00 grid shared by the student, advisor and admin timetables.
 * Overlapping sessions sit side by side and their shared window flashes red.
 */
import { useMemo } from 'react';
import { usePrefsStore } from '../../store/usePrefsStore.js';
import { ZoomControl, ResizableBox } from '../ui/resize.jsx';
import { X } from 'lucide-react';
import { DAYS, CAMPUSES, COURSE_TYPES } from '../../brain/courses.js';
import { dayLabel, formatHour, sessionsOverlap, overlapWindow } from '../../librarian/schedule.js';

const START_HOUR = 8;
const END_HOUR = 18;
const DEFAULT_HOUR_PX = 60;
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

function EventBlock({ ev, onRemove, hourPx }) {
  const { course, ghost, status } = ev;
  const top = (ev.start - START_HOUR) * hourPx;
  const height = (ev.end - ev.start) * hourPx;
  const compact = height < 90; // zoomed out: keep title and type, drop room and campus
  const width = 100 / ev.lanes;
  const color = COURSE_TYPES[course.type]?.block ?? 'bg-slate-500';

  return (
    <div className="absolute p-0.5" style={{ top, height, left: `${ev.lane * width}%`, width: `${width}%` }}>
      <div
        className={`h-full rounded-lg p-2 text-xs overflow-hidden relative ${
          ghost
            ? 'ghost-block text-indigo-800'
            : `${color} type-${course.type} text-white shadow-sm ${status === 'draft' ? 'ring-2 ring-offset-1 ring-white/70 border-2 border-dashed border-white/60' : ''}`
        }`}
      >
        <p className="font-semibold leading-tight pr-4">{course.title}</p>
        {!compact && <p>{ev.room}</p>}
        {!compact && (
          <p>
            {CAMPUSES[course.campus]?.short} · {course.cfu} CFU
          </p>
        )}
        <p className="font-medium">
          {ghost
            ? '👻 Ghost preview'
            : [COURSE_TYPES[course.type]?.label, status === 'draft' ? 'Draft' : status === 'confirmed' ? 'Confirmed' : course.code].join(' · ')}
        </p>
        {onRemove && !ghost && status === 'draft' && (
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

/**
 * @param courses  courses to draw; each may carry `status` ('confirmed' | 'draft')
 * @param ghost    optional course drawn as a striped preview
 * @param onRemove optional; shows a remove button on draft blocks
 */
export function WeekGrid({ courses, ghost = null, onRemove, tourId, collisionLabel = '🔥 Schedule Collision!' }) {
  const hourPx = usePrefsStore((s) => s.hourPx);
  const setPref = usePrefsStore((s) => s.setPref);
  const days = useMemo(() => {
    const events = [
      ...courses.flatMap((course) => course.sessions.map((s, i) => ({ key: `${course.code}-${i}`, course, status: course.status, ...s }))),
      ...(ghost ? ghost.sessions.map((s, i) => ({ key: `ghost-${ghost.code}-${i}`, course: ghost, ghost: true, ...s })) : []),
    ];
    return DAYS.map((day) => {
      const dayEvents = events.filter((e) => e.day === day);
      return { day, events: layoutDay(dayEvents), zones: collisionZones(dayEvents) };
    });
  }, [courses, ghost]);

  return (
    <>
      <div className="flex justify-end mb-2">
        <ZoomControl
          label="Calendar zoom"
          value={hourPx}
          min={36}
          max={120}
          step={8}
          format={(v) => `${Math.round((v / DEFAULT_HOUR_PX) * 100)}%`}
          onChange={(v) => setPref('hourPx', v)}
          onReset={hourPx !== DEFAULT_HOUR_PX ? () => setPref('hourPx', DEFAULT_HOUR_PX) : undefined}
        />
      </div>
      <ResizableBox id={`calendar-${tourId}`} label="Weekly timetable" minWidth={320} minHeight={220} innerClassName="rounded-xl">
        <div data-tour={tourId} className="min-w-[560px] bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-slate-200 bg-slate-50">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="p-2 text-center text-sm font-semibold text-slate-700 border-l border-slate-200">
                {dayLabel(d)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[56px_repeat(5,1fr)]">
            <div className="relative" style={{ height: HOURS.length * hourPx }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full text-right pr-2 text-xs text-slate-400 -translate-y-1/2"
                  style={{ top: (h - START_HOUR) * hourPx }}
                >
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
                  height: HOURS.length * hourPx,
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${hourPx - 1}px, var(--grid-line) ${hourPx - 1}px, var(--grid-line) ${hourPx}px)`,
                }}
                role="group"
                aria-label={`${dayLabel(day)}: ${events.map((e) => e.course.title).join(', ') || 'free'}`}
              >
                {events.map((ev) => (
                  <EventBlock key={ev.key} ev={ev} onRemove={onRemove} hourPx={hourPx} />
                ))}
                {zones.map((z) => (
                  <div
                    key={`${z.start}-${z.end}`}
                    className="collision-flash absolute inset-x-0 z-20 pointer-events-none flex items-end justify-center rounded-md border-2 border-red-600"
                    style={{ top: (z.start - START_HOUR) * hourPx, height: (z.end - z.start) * hourPx }}
                    role="alert"
                  >
                    <span className="mb-1 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">{collisionLabel}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </ResizableBox>
    </>
  );
}
