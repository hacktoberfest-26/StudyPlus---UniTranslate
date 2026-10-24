import { Send } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useAlerts, usePlanSummary } from '../../store/derived.js';

function StudentBar({ critical }) {
  const submission = usePlanStore((s) => s.submission);
  const submitDraft = usePlanStore((s) => s.submitDraft);
  const advisorNote = usePlanStore((s) => s.advisorNote);
  const { total, planCourses } = usePlanSummary();
  const blocked = critical > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
      <p className="text-sm text-blue-900">
        🎓 Planning <strong>{planCourses.length} courses · {total} CFU</strong> for Year 3 · Fall Semester
        {submission === 'changes' && advisorNote && (
          <span className="block text-xs text-red-700 mt-0.5">👨‍🏫 Prof. Rossi requested changes: “{advisorNote}”</span>
        )}
        {submission === 'approved' && <span className="block text-xs text-green-700 mt-0.5">✅ Prof. Rossi approved your plan. All courses are confirmed.</span>}
      </p>
      <button
        onClick={submitDraft}
        disabled={blocked || submission === 'submitted' || submission === 'approved'}
        title={blocked ? 'Resolve critical timetable alerts before submitting' : undefined}
        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Send className="w-4 h-4" aria-hidden />
        {submission === 'submitted' ? 'Awaiting Review' : submission === 'approved' ? 'Approved' : blocked ? 'Resolve alerts to submit' : 'Submit Draft to Advisor'}
      </button>
    </div>
  );
}

/** Student-only bar: plan summary, advisor feedback and submission. */
export function RoleContextBar() {
  const critical = useAlerts().filter((a) => a.severity === 'critical').length;

  return (
    <div className="px-4 sm:px-6 pb-3" data-tour="role-bar">
      <StudentBar critical={critical} />
    </div>
  );
}
