import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';

/**
 * Steps of the first-visit tour. `target` is a [data-tour] anchor; `tab` and
 * `scheduleMode` put the app in the right state before the step is shown.
 */
const MENU_STEP = {
  target: 'account-menu',
  title: 'Your account menu',
  body: 'Settings, display & accessibility (dark mode, colour-blind mode, text size), this tour, help and sign out are all here.',
};
const HELP_STEP = {
  target: 'help',
  title: "You're all set",
  body: 'Questions, or something not working? Tap ? for contact details, FAQ and a quick bug-report form.',
};

const STUDENT_STEPS = [
  {
    tab: 'home',
    title: 'Welcome to UniTranslate',
    body: 'A quick tour of where to start. Skip it if you prefer to look around. You can replay it anytime from your account menu.',
  },
  {
    target: 'entry-points',
    tab: 'home',
    title: 'Pick a starting point',
    body: 'Explore a course, start from a career goal, plan your week, or ask the tutor. Each one opens the right view.',
  },
  {
    target: 'attention',
    tab: 'home',
    title: 'What needs attention',
    body: 'Clashes and missing requirements show up here as soon as they happen, with a one-tap fix where possible.',
  },
  {
    target: 'semester',
    tab: 'home',
    title: 'Your degree and this semester',
    body: 'See your credits so far and what this plan adds. When there are no clashes, submit the plan to your advisor here.',
  },
  {
    target: 'course-card',
    tab: 'catalog',
    title: 'Explore courses',
    body: 'Each card warns about clashes and missing prerequisites before you add it. Preview it on your week, or compare 2–3 courses side by side.',
  },
  {
    target: 'alerts',
    tab: 'catalog',
    title: 'Alerts while you plan',
    body: 'While you change your plan, alerts stay beside you. A red clash can’t be dismissed; it goes away once the clash is fixed.',
  },
  {
    target: 'calendar',
    tab: 'schedule',
    scheduleMode: 'draft',
    title: 'My week',
    body: 'Your timetable. Clashes flash red. Tap a course on the right to preview it before adding it.',
  },
  {
    target: 'skill-tree',
    tab: 'skills',
    title: 'Start from a goal',
    body: 'Tap a career to see the courses that lead there. Tap a course to add it to your plan.',
  },
  {
    target: 'tutor',
    tab: 'advisor',
    title: 'Ask the tutor',
    body: 'Ask in plain words, e.g. “Which electives fit my timetable for FinTech?”. Suggested courses come with Add and Preview buttons.',
  },
  MENU_STEP,
  HELP_STEP,
];

const NEWCOMER_STEPS = [
  {
    tab: 'paths',
    title: 'Welcome to UniTranslate',
    body: 'Not sure what to study yet? Start from the job you’d like and we’ll show you how to get there.',
  },
  {
    target: 'interests',
    tab: 'paths',
    title: 'Tell us what you enjoy',
    body: 'Pick a few interests to narrow the careers, or search for a job or a skill.',
  },
  {
    target: 'career-grid',
    tab: 'paths',
    title: 'Choose a career',
    body: 'Each card shows demand, starting salary and how many routes lead there.',
  },
  {
    target: 'routes',
    tab: 'paths',
    title: 'Every way to get there',
    body: 'Each route shows the programme, what you study year by year and what you need to apply. Save the ones you like.',
  },
  {
    target: 'tabs',
    tab: 'paths',
    title: 'Programmes and your shortlist',
    body: 'Browse all programmes to see where each one leads. Your shortlist keeps saved routes and next steps for applying.',
  },
  MENU_STEP,
  HELP_STEP,
];

const ADVISOR_STEPS = [
  {
    tab: 'advisees',
    title: 'Welcome, Prof. Rossi',
    body: "This is the advisor workspace. Review and approve your students' plans here. Plans are read-only for you.",
  },
  {
    target: 'advisees',
    tab: 'advisees',
    title: 'Your students',
    body: "Alex's row is live and updates as Alex edits the plan. Open it with Review plan. The others are sample records.",
  },
  {
    target: 'review-findings',
    tab: 'review',
    title: 'Findings',
    body: 'Clashes, missing prerequisites and credit problems are flagged for you automatically.',
  },
  {
    target: 'review-decision',
    tab: 'review',
    title: 'Approve or request changes',
    body: 'Leave feedback, request changes, or approve. You can only approve a plan that has been submitted and has no clashes.',
  },
  MENU_STEP,
  HELP_STEP,
];

const ADMIN_STEPS = [
  {
    tab: 'courses',
    title: 'Department workspace',
    body: 'Maintain the course catalogue that students and advisors see. Individual study plans are not visible here.',
  },
  {
    target: 'ingest',
    tab: 'courses',
    title: 'Import course data',
    body: 'Import raw syllabus files. Clean records are published straight away. Broken ones are held back with the reason.',
  },
  {
    target: 'dept-timetable',
    tab: 'timetable',
    title: 'Department timetable',
    body: 'All courses on one week. Red zones show courses scheduled at the same time.',
  },
  {
    target: 'reports',
    tab: 'reports',
    title: 'Reports & feedback',
    body: 'Bug reports and messages from any user arrive here. Mark them resolved when fixed.',
  },
  MENU_STEP,
  HELP_STEP,
];

export const TOUR_STEPS = { newcomer: NEWCOMER_STEPS, student: STUDENT_STEPS, advisor: ADVISOR_STEPS, admin: ADMIN_STEPS };

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
        <div className="absolute inset-0 bg-ink-900/60" />
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
