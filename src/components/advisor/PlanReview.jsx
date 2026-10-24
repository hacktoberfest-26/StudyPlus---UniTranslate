import { useState } from 'react';
import { Check, MessageSquare, History, Lock } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useAlerts, usePlanSummary } from '../../store/derived.js';
import { STUDENT } from '../../brain/student.js';
import { CAREERS } from '../../brain/skillGraph.js';
import { formatSchedule } from '../../librarian/schedule.js';
import { DegreeProgress } from '../layout/DegreeProgress.jsx';
import { AlertCard } from '../alerts/ProactiveAlerts.jsx';
import { WeekGrid } from '../schedule/WeekGrid.jsx';
import { TypeChip } from '../ui/primitives.jsx';
import { STATUS_PILLS } from './AdviseesDashboard.jsx';
import { useColumnWidths, ResizableTh, ResetColumnsButton, ResizableBox } from '../ui/resize.jsx';

const PLAN_COLUMNS = { course: 260, type: 130, schedule: 190, cfu: 80, status: 120 };

const LOG_LABELS = {
  submitted: 'Alex submitted the plan',
  approved: 'You approved the plan',
  changes: 'You requested changes',
};

const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function DecisionPanel({ critical }) {
  const submission = usePlanStore((s) => s.submission);
  const approveDraft = usePlanStore((s) => s.approveDraft);
  const requestChanges = usePlanStore((s) => s.requestChanges);
  const reviewLog = usePlanStore((s) => s.reviewLog);
  const [note, setNote] = useState('');

  const canApprove = submission === 'submitted' && critical === 0;
  const approveHint =
    submission === 'approved'
      ? 'This plan is already approved.'
      : submission !== 'submitted'
        ? "Alex hasn't submitted this plan yet. You can still send feedback."
        : critical > 0
          ? 'Approval is blocked while the plan has a timetable overlap.'
          : 'The plan has no critical issues and can be approved.';

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3" data-tour="review-decision" aria-label="Your decision">
      <h3 className="font-semibold text-slate-900">Your decision</h3>
      <p className={`text-xs rounded-lg px-3 py-2 ${canApprove ? 'bg-green-50 text-green-800' : 'bg-slate-50 text-slate-600'}`}>{approveHint}</p>
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Feedback for Alex</span>
        <textarea
          id="advisor-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="e.g. Swap Advanced Data Science for an elective that doesn't clash with Digital Business Strategy."
          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => {
            requestChanges(note.trim());
            setNote('');
          }}
          disabled={submission === 'approved'}
          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium px-3 py-2 rounded-lg"
        >
          <MessageSquare className="w-4 h-4" aria-hidden /> Request changes
        </button>
        <button
          onClick={() => {
            approveDraft(note.trim());
            setNote('');
          }}
          disabled={!canApprove}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 rounded-lg"
        >
          <Check className="w-4 h-4" aria-hidden /> {submission === 'approved' ? 'Approved' : 'Approve plan'}
        </button>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          <History className="w-3.5 h-3.5" aria-hidden /> Review history
        </h4>
        {reviewLog.length ? (
          <ol className="space-y-2">
            {[...reviewLog].reverse().map((e) => (
              <li key={e.id} className="text-xs text-slate-700">
                <span className="text-slate-400 tabular-nums">{when(e.at)}</span> · {LOG_LABELS[e.action]}
                {e.note && <span className="block text-slate-500 mt-0.5">“{e.note}”</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-500">No activity yet.</p>
        )}
      </div>
    </section>
  );
}

/** Advisor view of Alex's plan. Everything here is read-only except the decision. */
export function PlanReview() {
  const submission = usePlanStore((s) => s.submission);
  const alerts = useAlerts();
  const { planCourses, total, conflictCodes } = usePlanSummary();
  const findings = alerts.filter((a) => a.severity !== 'success' || a.id === 'all-clear');
  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const cols = useColumnWidths('plan-review', PLAN_COLUMNS);
  const goals = STUDENT.careerGoals.map((id) => CAREERS.find((c) => c.id === id)?.label).join(', ');

  return (
    <div>
      <div className="bg-white border-b border-slate-200 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Plan Review: Alex</h2>
          <p className="text-sm text-slate-600">
            {STUDENT.programme} · {STUDENT.track} track · {STUDENT.term} · Goals: {goals}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" aria-hidden /> Read-only for advisors
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_PILLS[submission].className}`}>
            {STATUS_PILLS[submission].label}
          </span>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200">
        <DegreeProgress />
      </div>

      <div className="p-4 sm:p-6 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4 min-w-0">
          <section className="bg-white border border-slate-200 rounded-xl p-4" data-tour="review-findings" aria-label="Agent findings">
            <h3 className="font-semibold text-slate-900 mb-3">Agent findings</h3>
            <ul className="grid gap-3 md:grid-cols-2">
              {findings.map((a) => (
                <AlertCard key={a.id} alert={a} readOnly />
              ))}
            </ul>
          </section>

          <ResizableBox
            id="plan-courses-table"
            label="Courses in the plan"
            minWidth={320}
            minHeight={160}
            innerClassName="bg-white border border-slate-200 rounded-xl"
          >
            <section aria-label="Courses in the plan">
              <table className="table-fixed text-sm [&_td]:break-words" style={{ width: cols.total, minWidth: '100%' }}>
                <caption className="text-left font-semibold text-slate-900 px-4 pt-4 pb-2">
                  Courses in the plan · {planCourses.length} courses, {total} CFU <ResetColumnsButton cols={cols} />
                </caption>
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <ResizableTh id="course" label="Course" cols={cols} className="text-left px-4" />
                    <ResizableTh id="type" label="Type" cols={cols} className="text-left px-4" />
                    <ResizableTh id="schedule" label="Schedule" cols={cols} className="text-left px-4" />
                    <ResizableTh id="cfu" label="CFU" cols={cols} className="text-right px-4" />
                    <ResizableTh id="status" label="Status" cols={cols} className="text-left px-4" />
                  </tr>
                </thead>
                <tbody>
                  {planCourses.map((c) => (
                    <tr key={c.code} className={`border-t border-slate-100 ${conflictCodes.has(c.code) ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-900">{c.title}</p>
                        <p className="text-xs font-mono text-slate-500">{c.code}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <TypeChip type={c.type} />
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {formatSchedule(c)}
                        {conflictCodes.has(c.code) && <span className="block text-xs font-medium text-red-700">🔥 Overlap</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{c.cfu}</td>
                      <td className="px-4 py-2.5 text-xs">{c.status === 'confirmed' ? 'Confirmed' : 'Draft'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </ResizableBox>

          <section aria-label="Alex's weekly timetable">
            <h3 className="font-semibold text-slate-900 mb-2">Weekly timetable</h3>
            <WeekGrid courses={planCourses} tourId="review-calendar" />
          </section>
        </div>

        <div className="xl:sticky xl:top-[calc(var(--sticky-top)+1rem)] self-start">
          <DecisionPanel critical={critical} />
        </div>
      </div>
    </div>
  );
}
