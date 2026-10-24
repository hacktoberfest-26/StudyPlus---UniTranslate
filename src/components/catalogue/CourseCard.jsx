import { Calendar, MapPin, Users, ExternalLink, Plus, Check, Eye, Scale, TriangleAlert } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { usePlanCourses } from '../../store/derived.js';
import { CAMPUSES, FORMATS } from '../../brain/courses.js';
import { STUDENT } from '../../brain/student.js';
import { formatSchedule, conflictsWith } from '../../librarian/schedule.js';
import { prerequisiteStatus } from '../../agents/planning.js';
import { TypeChip } from '../ui/primitives.jsx';

export function CourseCard({ course }) {
  const planCourses = usePlanCourses();
  const addCourse = usePlanStore((s) => s.addCourse);
  const removeCourse = usePlanStore((s) => s.removeCourse);
  const previewCourse = usePlanStore((s) => s.previewCourse);
  const toggleCompare = usePlanStore((s) => s.toggleCompare);
  const openSyllabus = usePlanStore((s) => s.openSyllabus);
  const comparing = usePlanStore((s) => s.compareCodes.includes(course.code));

  const entry = planCourses.find((c) => c.code === course.code);
  const clashes = conflictsWith(course, planCourses);
  const missing = prerequisiteStatus(course, STUDENT, planCourses).filter((p) => p.status === 'missing');

  return (
    <article
      className={`bg-white border rounded-xl p-4 sm:p-5 hover:shadow-lg transition-shadow flex flex-col ${
        entry ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-slate-500">{course.code}</p>
          <h3 className="font-semibold text-slate-900 leading-snug">{course.title}</h3>
          <p className="text-sm text-slate-600">{course.lecturer}</p>
        </div>
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full shrink-0">{course.cfu} CFU</span>
      </div>

      <ul className="space-y-1.5 mb-3 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <Calendar className="w-4 h-4 shrink-0" aria-hidden /> {formatSchedule(course)}
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="w-4 h-4 shrink-0" aria-hidden /> {CAMPUSES[course.campus]?.label} · {course.sessions[0]?.room}
        </li>
        <li className="flex items-center gap-2">
          <Users className="w-4 h-4 shrink-0" aria-hidden /> {FORMATS[course.format]}
        </li>
      </ul>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <TypeChip type={course.type} />
        <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">{course.attendance}</span>
        {entry && (
          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">{entry.status === 'confirmed' ? 'Confirmed' : 'In Draft'}</span>
        )}
      </div>

      {(clashes.length > 0 || missing.length > 0) && (
        <div className="mb-3 space-y-1">
          {clashes.map((c) => (
            <p key={c.code} className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 rounded px-2 py-1">
              <TriangleAlert className="w-3.5 h-3.5 shrink-0" aria-hidden /> Overlaps {c.title}
            </p>
          ))}
          {missing.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 rounded px-2 py-1">
              <TriangleAlert className="w-3.5 h-3.5 shrink-0" aria-hidden /> Missing prerequisite: {missing.map((m) => m.label).join(', ')}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => openSyllabus(course.code)}
        className="self-start text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1 mb-4"
      >
        <ExternalLink className="w-3.5 h-3.5" aria-hidden /> Official Syllabus
      </button>

      <div className="mt-auto grid grid-cols-3 gap-2">
        {entry ? (
          <button
            onClick={() => removeCourse(course.code)}
            className="inline-flex items-center justify-center gap-1 bg-blue-50 border border-blue-300 text-blue-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-xs sm:text-sm font-medium py-2 px-2 rounded-lg transition-colors"
            aria-label={`Remove ${course.title} from plan`}
          >
            <Check className="w-4 h-4" aria-hidden /> In Plan
          </button>
        ) : (
          <button
            onClick={() => addCourse(course.code)}
            className="inline-flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium py-2 px-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden /> Add to Draft
          </button>
        )}
        <button
          onClick={() => previewCourse(course.code)}
          className="inline-flex items-center justify-center gap-1 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium py-2 px-2 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" aria-hidden /> Preview
        </button>
        <button
          onClick={() => toggleCompare(course.code)}
          aria-pressed={comparing}
          className={`inline-flex items-center justify-center gap-1 border text-xs sm:text-sm font-medium py-2 px-2 rounded-lg transition-colors ${
            comparing ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-slate-300 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Scale className="w-4 h-4" aria-hidden /> {comparing ? 'Selected' : 'Compare'}
        </button>
      </div>
    </article>
  );
}
