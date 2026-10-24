import { useState } from 'react';
import { Send, MessageSquare, Check } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useAlerts, usePlanSummary } from '../../store/derived.js';
import { LibrarianConsole } from './LibrarianConsole.jsx';

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
        {advisorNote && <span className="block text-xs text-red-700 mt-0.5">👨‍🏫 Prof. Rossi: “{advisorNote}”</span>}
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

function AdvisorBar({ critical, warnings }) {
  const approveDraft = usePlanStore((s) => s.approveDraft);
  const requestChanges = usePlanStore((s) => s.requestChanges);
  const submission = usePlanStore((s) => s.submission);
  const { total, planCourses } = usePlanSummary();
  const [note, setNote] = useState('');

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 space-y-2">
      <p className="text-sm text-emerald-900">
        👨‍🏫 Reviewing <strong>Alex's draft</strong> — {planCourses.length} courses, {total} CFU ·{' '}
        <span className={critical ? 'text-red-700 font-semibold' : ''}>{critical} critical</span> · {warnings} warnings
        {submission === 'submitted' && <span className="ml-2 text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Submitted</span>}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Feedback for Alex (optional)…"
          aria-label="Feedback for Alex"
          className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              requestChanges(note.trim());
              setNote('');
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-emerald-600 text-emerald-700 hover:bg-emerald-100 text-sm font-medium px-3 py-1.5 rounded-lg"
          >
            <MessageSquare className="w-4 h-4" aria-hidden /> Request Changes
          </button>
          <button
            onClick={approveDraft}
            disabled={critical > 0 || submission === 'approved'}
            title={critical ? 'Cannot approve a plan with timetable overlaps' : undefined}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-lg"
          >
            <Check className="w-4 h-4" aria-hidden /> {submission === 'approved' ? 'Approved' : 'Approve Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoleContextBar() {
  const role = usePlanStore((s) => s.role);
  const alerts = useAlerts();
  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const warnings = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="px-4 sm:px-6 pb-3">
      {role === 'student' && <StudentBar critical={critical} />}
      {role === 'advisor' && <AdvisorBar critical={critical} warnings={warnings} />}
      {role === 'admin' && <LibrarianConsole />}
    </div>
  );
}
