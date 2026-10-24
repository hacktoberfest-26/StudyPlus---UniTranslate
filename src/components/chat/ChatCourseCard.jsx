import { usePlanStore } from '../../store/usePlanStore.js';
import { useCatalogIndex, usePlanCourses } from '../../store/derived.js';
import { CAMPUSES } from '../../brain/courses.js';
import { STUDENT } from '../../brain/student.js';
import { formatSchedule, conflictsWith } from '../../librarian/schedule.js';
import { prerequisiteStatus } from '../../agents/planning.js';
import { TypeChip } from '../ui/primitives.jsx';

/** Mini course card rendered inside tutor replies — status is re-evaluated live. */
export function ChatCourseCard({ code }) {
  const course = useCatalogIndex()[code];
  const planCourses = usePlanCourses();
  const addCourse = usePlanStore((s) => s.addCourse);
  const previewCourse = usePlanStore((s) => s.previewCourse);
  if (!course) return null;

  const inPlan = planCourses.some((c) => c.code === code);
  const clashes = inPlan ? [] : conflictsWith(course, planCourses);
  const missing = prerequisiteStatus(course, STUDENT, planCourses).filter((p) => p.status === 'missing');

  return (
    <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3 text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-slate-500">{course.code}</p>
          <p className="text-sm font-semibold text-slate-900 leading-tight">{course.title}</p>
        </div>
        <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">{course.cfu} CFU</span>
      </div>
      <p className="text-xs text-slate-600 mt-1">
        {formatSchedule(course)} · {CAMPUSES[course.campus]?.short}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <TypeChip type={course.type} />
        {inPlan && <span className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded-full">In your plan</span>}
        {clashes.length > 0 && <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🔥 Clashes with {clashes[0].title}</span>}
        {missing.length > 0 && <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Needs {missing.map((m) => m.label).join(', ')}</span>}
        {!inPlan && !clashes.length && !missing.length && <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Fits timetable</span>}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => addCourse(code)}
          disabled={inPlan}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium py-1.5 px-2 rounded-lg"
        >
          ⚡ Add to Plan
        </button>
        <button
          onClick={() => previewCourse(code)}
          disabled={inPlan}
          className="flex-1 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-medium py-1.5 px-2 rounded-lg"
        >
          📅 Ghost Preview on Calendar
        </button>
      </div>
    </div>
  );
}
