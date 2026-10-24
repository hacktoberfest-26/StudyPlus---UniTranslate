import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';

/**
 * Steps of the first-visit tour. `target` is a [data-tour] anchor; `tab` and
 * `scheduleMode` put the app in the right state before the step is shown.
 */
const STUDENT_STEPS = [
  {
    title: 'Welcome to StudyPlus UniTranslate',
    body: "This short tour (about 2 minutes) shows how to plan your semester: browse courses, test them on your timetable, follow your career path and get help from the AI tutor. Skip it if you already know your way around. You can restart it anytime from the Tour button.",
  },
  {
    target: 'role',
    title: 'Switch roles',
    body: 'This demo has three separate workspaces. You are in the Student workspace, where you build your plan. Switch here to see the Academic Advisor who reviews it, or the Department Admin who manages course data.',
  },
  {
    target: 'autosave',
    title: 'Your draft saves itself',
    body: 'Every change is saved automatically. The status shows whether your plan is an active draft, waiting for review, or approved.',
  },
  {
    target: 'progress',
    title: 'Degree progress',
    body: 'Solid colour shows the 114 of 180 CFU you have completed, split into Core, Electives and Thesis. Striped colour shows the credits planned this semester.',
  },
  {
    target: 'alerts',
    title: 'Alerts that watch your plan',
    body: 'Agents check your plan after every change. A red overlap alert cannot be dismissed. It disappears only when you fix the clash, for example with ⚡ Apply Smart Recommendation. Yellow alerts flag missing prerequisites or credits.',
  },
  {
    target: 'tabs',
    title: 'Four views of one plan',
    body: 'Catalogue, Schedule, Skill Tree and AI Tutor all share the same live plan, so a change in one view shows up everywhere.',
  },
  {
    target: 'catalog-filters',
    tab: 'catalog',
    title: 'Find courses',
    body: 'Search by title, code or lecturer, and filter by campus, teaching format, CFU and the days you want to be on campus.',
  },
  {
    target: 'course-card',
    tab: 'catalog',
    title: 'Course cards',
    body: 'Each card shows the schedule, location and attendance rule, and warns you about clashes or missing prerequisites. Add it to your draft, preview it on your calendar, or select 2–3 courses to compare side by side.',
  },
  {
    target: 'view-mode',
    tab: 'schedule',
    scheduleMode: 'draft',
    title: 'Confirmed vs. draft',
    body: 'Confirmed Schedule shows only courses you are enrolled in. Draft Preview adds the courses you are still considering.',
  },
  {
    target: 'calendar',
    tab: 'schedule',
    scheduleMode: 'draft',
    title: 'Your week at a glance',
    body: 'Blue is compulsory, purple elective, green seminar. When two classes overlap, the clash flashes red with "🔥 Schedule Collision!".',
  },
  {
    target: 'ghost-picker',
    tab: 'schedule',
    scheduleMode: 'draft',
    title: 'Ghost preview',
    body: 'Hover over or tap a course here to see it as a striped "ghost" on your week before you add it. Clashes show up immediately.',
  },
  {
    target: 'skill-tree',
    tab: 'skills',
    title: 'Skill tree & careers',
    body: 'Follow how foundation courses unlock advanced subjects and careers. Tap a course to add it to your plan, preview it or read its syllabus. Tap a career to highlight the exact path that leads to it.',
  },
  {
    target: 'tutor',
    tab: 'advisor',
    title: 'StudyPlus AI Tutor',
    body: 'Ask about electives, clashes, prerequisites or careers. Switch to Course Concept Tutor mode for syllabus explanations. Suggested courses come with ⚡ Add to Plan and 📅 Ghost Preview buttons.',
  },
  {
    target: 'quick-prompts',
    tab: 'advisor',
    title: 'Not sure what to ask?',
    body: 'Tap a quick prompt to get started. You can also open the tutor from any view with the round button in the bottom-right corner.',
  },
  {
    target: 'role-bar',
    tab: 'catalog',
    title: 'Safe changes, then submit',
    body: "Before you drop a course or add one that causes a clash, you'll see a confirmation listing exactly what changes. When the plan has no red alerts, submit it to Prof. Rossi here.",
  },
  {
    target: 'help',
    title: "You're all set",
    body: 'Tap Tour anytime to see this guide again, or ↻ to reset the demo data.',
  },
];

const ADVISOR_STEPS = [
  {
    title: 'Welcome, Prof. Rossi',
    body: 'This is the Advisor workspace. You review and approve your students\' study plans here. Plans are read-only for you: only the student can add or drop courses.',
  },
  {
    target: 'advisee-stats',
    tab: 'advisees',
    title: 'Your advisees at a glance',
    body: 'See how many plans are waiting for your review and which ones have critical issues.',
  },
  {
    target: 'advisees',
    tab: 'advisees',
    title: 'Student list',
    body: "Alex's row is live and updates as Alex edits the plan. Use Review plan to open it. The other students are sample records.",
  },
  {
    target: 'review-findings',
    tab: 'review',
    title: 'Agent findings',
    body: 'The same agents that guide the student flag clashes, missing prerequisites and credit problems for you.',
  },
  {
    target: 'review-calendar',
    tab: 'review',
    title: "The student's week",
    body: 'A read-only view of the timetable, with overlaps flashing red.',
  },
  {
    target: 'review-decision',
    tab: 'review',
    title: 'Approve or request changes',
    body: 'Leave feedback for Alex, request changes, or approve the plan. Approval is only possible once Alex has submitted the plan and it has no overlaps. Approving confirms every course.',
  },
  {
    target: 'tabs',
    tab: 'review',
    title: 'Course catalogue for reference',
    body: 'Browse the catalogue, compare courses and read syllabi while advising. It is read-only in this workspace.',
  },
  {
    target: 'role',
    title: 'Switch workspace',
    body: 'Switch to the Student view to act as Alex (for example, to submit the plan), or to the Admin view. Tap Tour anytime to see this guide again.',
  },
];

const ADMIN_STEPS = [
  {
    title: 'Department Admin workspace',
    body: 'This is where the course catalogue is maintained. Everything students and advisors see comes from these records. Admins do not see or edit individual study plans.',
  },
  {
    target: 'ingest',
    tab: 'courses',
    title: 'The Librarian',
    body: 'Run the ingestion to read raw syllabus files. Clean records are published to the catalogue straight away. Broken ones are held back with the reason, such as a missing timetable slot.',
  },
  {
    target: 'course-table',
    tab: 'courses',
    title: 'Course records',
    body: 'Every course with its schedule, room, prerequisites and source. Courses that share a time slot with another course are flagged.',
  },
  {
    target: 'dept-timetable',
    tab: 'timetable',
    title: 'Department timetable',
    body: 'All courses on one week. Red zones show slots where two courses run at the same time, so you can spot clashes before students run into them.',
  },
  {
    target: 'role',
    title: 'Switch workspace',
    body: 'Switch to the Student or Advisor views to see the other side of the system. Tap Tour anytime to see this guide again.',
  },
];

export const TOUR_STEPS = { student: STUDENT_STEPS, advisor: ADVISOR_STEPS, admin: ADMIN_STEPS };

const GAP = 12;
const MARGIN = 16;
const PAD = 6;

function placeCard(rect, card, vw, vh) {
  const w = card.width;
  const h = card.height;
  if (!rect) return { left: (vw - w) / 2, top: Math.max(MARGIN, (vh - h) / 2) };
  const clampX = (x) => Math.min(Math.max(x, MARGIN), vw - w - MARGIN);
  const clampY = (y) => Math.min(Math.max(y, MARGIN), vh - h - MARGIN);
  const centerX = clampX(rect.left + rect.width / 2 - w / 2);
  if (vh - rect.bottom >= h + GAP + MARGIN) return { left: centerX, top: rect.bottom + GAP };
  if (rect.top >= h + GAP + MARGIN) return { left: centerX, top: rect.top - h - GAP };
  if (vw - rect.right >= w + GAP + MARGIN) return { left: rect.right + GAP, top: clampY(rect.top) };
  if (rect.left >= w + GAP + MARGIN) return { left: rect.left - w - GAP, top: clampY(rect.top) };
  return { left: clampX((vw - w) / 2), top: vh - h - MARGIN };
}

export function GuidedTour() {
  const step = usePlanStore((s) => s.tourStep);
  const setTourStep = usePlanStore((s) => s.setTourStep);
  const endTour = usePlanStore((s) => s.endTour);
  const setTab = usePlanStore((s) => s.setTab);
  const setScheduleMode = usePlanStore((s) => s.setScheduleMode);
  const steps = TOUR_STEPS[usePlanStore((s) => s.role)];

  const [rect, setRect] = useState(null);
  const [card, setCard] = useState({ width: 360, height: 220 });
  const [viewport, setViewport] = useState({ vw: window.innerWidth, vh: window.innerHeight });
  const cardRef = useRef(null);
  const nextRef = useRef(null);

  const current = step != null ? steps[step] : null;
  const isLast = step === steps.length - 1;

  const measure = useCallback(() => {
    setViewport({ vw: window.innerWidth, vh: window.innerHeight });
    const el = current?.target && document.querySelector(`[data-tour="${current.target}"]`);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right });
  }, [current]);

  // Put the app in the step's state, bring the target into view, then measure it.
  useEffect(() => {
    if (!current) return undefined;
    if (current.tab) setTab(current.tab);
    if (current.scheduleMode) setScheduleMode(current.scheduleMode);
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = current.target && document.querySelector(`[data-tour="${current.target}"]`);
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
        measure();
      });
    });
    const timer = setTimeout(measure, 450); // after smooth scrolling settles
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, [current, measure, setTab, setScheduleMode]);

  useEffect(() => {
    if (!current) return undefined;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [current, measure]);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (el && (el.offsetWidth !== card.width || el.offsetHeight !== card.height)) {
      setCard({ width: el.offsetWidth, height: el.offsetHeight });
    }
  });

  useEffect(() => {
    if (current) nextRef.current?.focus();
  }, [current]);

  const go = (delta) => {
    const next = step + delta;
    if (next < 0) return;
    if (next >= steps.length) endTour();
    else setTourStep(next);
  };

  useEffect(() => {
    if (!current) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') endTour();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!current) return null;

  const spot = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  // Clip very tall targets (e.g. the whole calendar) to the visible viewport.
  const visibleRect = rect && {
    ...rect,
    top: Math.max(rect.top, 0),
    bottom: Math.min(rect.bottom, viewport.vh),
  };
  const pos = placeCard(step === 0 ? null : visibleRect, card, viewport.vw, viewport.vh);

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {/* Blocks clicks on the app while the tour is open. */}
      <div className="absolute inset-0" />
      {spot ? (
        <div
          className="absolute rounded-xl ring-2 ring-amber-400 pointer-events-none transition-all duration-300"
          style={{ ...spot, boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/60" />
      )}

      <div
        ref={cardRef}
        className="absolute bg-white rounded-2xl shadow-2xl p-5 transition-[top,left] duration-300"
        style={{ top: pos.top, left: pos.left, width: `min(${step === 0 ? 440 : 360}px, calc(100vw - ${MARGIN * 2}px))` }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
            <Compass className="w-4 h-4" aria-hidden />
            {step === 0 ? 'Guided tour' : `Step ${step} of ${steps.length - 1}`}
          </span>
          <button onClick={endTour} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Close tour">
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
        <h2 id="tour-title" className="text-base font-bold text-slate-900">
          {current.title}
        </h2>
        <p id="tour-body" className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          {current.body}
        </p>

        {step > 0 && (
          <div className="flex gap-1 mt-4" aria-hidden>
            {steps.slice(1).map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-4">
          {isLast ? (
            <span />
          ) : (
            <button onClick={endTour} className="text-sm font-medium text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline">
              {step === 0 ? 'Skip, I know my way around' : 'Skip tour'}
            </button>
          )}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => go(-1)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden /> Back
              </button>
            )}
            <button
              ref={nextRef}
              onClick={() => go(1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
            >
              {step === 0 ? 'Start tour' : isLast ? 'Finish' : 'Next'}
              {!isLast && <ArrowRight className="w-4 h-4" aria-hidden />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
