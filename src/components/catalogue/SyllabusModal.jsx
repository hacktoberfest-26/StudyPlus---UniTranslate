import { X } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useCatalogIndex } from '../../store/derived.js';
import { CAMPUSES, FORMATS } from '../../brain/courses.js';
import { formatSchedule } from '../../librarian/schedule.js';
import { skillLabel } from '../../agents/planning.js';
import { Modal } from '../ui/primitives.jsx';

export function SyllabusModal() {
  const code = usePlanStore((s) => s.syllabusCode);
  const close = usePlanStore((s) => s.closeSyllabus);
  const askTutor = usePlanStore((s) => s.askTutor);
  const setTutorMode = usePlanStore((s) => s.setTutorMode);
  const isStudent = usePlanStore((s) => s.role === 'student');
  const course = useCatalogIndex()[code];
  if (!course) return null;

  return (
    <Modal title={`${course.title} syllabus`} onClose={close}>
      <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-slate-500">{course.code} · Official Syllabus</p>
          <h2 className="text-lg font-bold text-slate-900">{course.title}</h2>
          <p className="text-sm text-slate-600">
            {course.lecturer} · {course.cfu} CFU · {formatSchedule(course)}
          </p>
        </div>
        <button onClick={close} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Close syllabus">
          <X className="w-5 h-5 text-slate-600" aria-hidden />
        </button>
      </div>
      <div className="p-5 space-y-4 text-sm text-slate-700">
        <p>{course.syllabus.summary}</p>
        {course.syllabus.topics.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Topics</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              {course.syllabus.topics.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-slate-500 uppercase tracking-wide">Prerequisites</dt>
            <dd>{course.prerequisites.length ? course.prerequisites.map(skillLabel).join(', ') : 'None'}</dd>
          </div>
          <div>
            <dt className="text-slate-500 uppercase tracking-wide">Assessment</dt>
            <dd>{course.assessment}</dd>
          </div>
          <div>
            <dt className="text-slate-500 uppercase tracking-wide">Location</dt>
            <dd>
              {CAMPUSES[course.campus]?.label} · {FORMATS[course.format]}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 uppercase tracking-wide">Attendance</dt>
            <dd>{course.attendance}</dd>
          </div>
        </dl>
        {isStudent && (
        <button
          onClick={() => {
            close();
            setTutorMode('concept');
            askTutor(`Explain ${course.title}`);
          }}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg"
        >
          🤖 Ask the AI Tutor to explain this syllabus
        </button>
        )}
      </div>
    </Modal>
  );
}
