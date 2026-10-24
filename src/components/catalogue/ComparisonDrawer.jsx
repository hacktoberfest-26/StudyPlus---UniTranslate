import { X } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useCatalogIndex, usePlanCourses } from '../../store/derived.js';
import { CAMPUSES, FORMATS } from '../../brain/courses.js';
import { STUDENT } from '../../brain/student.js';
import { formatSchedule, conflictsWith } from '../../librarian/schedule.js';
import { prerequisiteStatus } from '../../agents/planning.js';
import { Modal, Stars, TypeChip } from '../ui/primitives.jsx';

/** Side-by-side matrix for 2–3 courses, evaluated against the live draft plan. */
export function ComparisonDrawer() {
  const open = usePlanStore((s) => s.compareOpen);
  const codes = usePlanStore((s) => s.compareCodes);
  const closeCompare = usePlanStore((s) => s.closeCompare);
  const addCourse = usePlanStore((s) => s.addCourse);
  const previewCourse = usePlanStore((s) => s.previewCourse);
  const index = useCatalogIndex();
  const planCourses = usePlanCourses();

  if (!open || codes.length < 2) return null;
  const courses = codes.map((c) => index[c]).filter(Boolean);
  const minWorkload = Math.min(...courses.map((c) => c.workload));
  const maxReview = Math.max(...courses.map((c) => c.reviewScore ?? 0));

  const rows = [
    { label: 'CFU Credits', render: (c) => <span className="font-semibold">{c.cfu} CFU</span> },
    { label: 'Type', render: (c) => <TypeChip type={c.type} /> },
    {
      label: 'Workload Rating',
      render: (c) => (
        <span className="inline-flex items-center gap-2">
          <Stars rating={c.workload} />
          {c.workload === minWorkload && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded">lightest</span>}
        </span>
      ),
    },
    {
      label: 'Student Review Score',
      render: (c) => (
        <span className="inline-flex items-center gap-2">
          <Stars rating={c.reviewScore} />
          {c.reviewScore === maxReview && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded">top rated</span>}
        </span>
      ),
    },
    { label: 'Schedule', render: (c) => formatSchedule(c) },
    { label: 'Location & Format', render: (c) => `${CAMPUSES[c.campus]?.label} · ${FORMATS[c.format]}` },
    {
      label: 'Conflicts with Draft',
      render: (c) => {
        if (planCourses.some((p) => p.code === c.code)) return <span className="text-blue-700">Already in plan</span>;
        const clashes = conflictsWith(c, planCourses);
        return clashes.length ? (
          <span className="text-red-700 font-medium">🔥 {clashes.map((x) => x.title).join(', ')}</span>
        ) : (
          <span className="text-green-700 font-medium">✅ No overlap</span>
        );
      },
    },
    {
      label: 'Prerequisites',
      render: (c) => {
        const st = prerequisiteStatus(c, STUDENT, planCourses);
        if (!st.length) return 'None';
        return (
          <ul className="space-y-0.5">
            {st.map((p) => (
              <li key={p.id} className={p.status === 'missing' ? 'text-amber-700' : 'text-slate-700'}>
                {p.status === 'met' ? '✅' : p.status === 'concurrent' ? '📘' : '❌'} {p.label}
              </li>
            ))}
          </ul>
        );
      },
    },
    { label: 'Assessment Format', render: (c) => c.assessment },
    { label: 'Attendance', render: (c) => c.attendance },
  ];

  return (
    <Modal title="Course Comparison" onClose={closeCompare} wide>
      <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">⚖️ Course Comparison</h2>
        <button onClick={closeCompare} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Close comparison">
          <X className="w-5 h-5 text-slate-600" aria-hidden />
        </button>
      </div>
      <div className="p-4 sm:p-6 overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[560px] text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="w-40" />
              {courses.map((c) => (
                <th key={c.code} scope="col" className="text-left align-bottom p-3 bg-slate-50 first:rounded-tl-lg last:rounded-tr-lg">
                  <p className="text-xs font-mono text-slate-500">{c.code}</p>
                  <p className="font-bold text-slate-900">{c.title}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium p-3 border-t border-slate-100">
                  {row.label}
                </th>
                {courses.map((c) => (
                  <td key={c.code} className="p-3 border-t border-slate-100 text-slate-700 align-top">
                    {row.render(c)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td />
              {courses.map((c) => (
                <td key={c.code} className="p-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => addCourse(c.code)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg">
                      + Add to Draft
                    </button>
                    <button onClick={() => previewCourse(c.code)} className="flex-1 border border-slate-300 hover:bg-slate-50 text-xs font-medium py-2 rounded-lg">
                      👁️ Preview
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
