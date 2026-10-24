import { ArrowRight } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useAlerts, usePlanSummary } from '../../store/derived.js';
import { STUDENT, SAMPLE_ADVISEES } from '../../brain/student.js';

export const STATUS_PILLS = {
  draft: { label: 'Draft in progress', className: 'bg-slate-100 text-slate-700' },
  submitted: { label: 'Awaiting your review', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  changes: { label: 'Changes requested', className: 'bg-red-100 text-red-700' },
};

/** Advisor landing view: every advisee's plan status, with Alex's row computed live. */
export function AdviseesDashboard() {
  const submission = usePlanStore((s) => s.submission);
  const setTab = usePlanStore((s) => s.setTab);
  const alerts = useAlerts();
  const { total } = usePlanSummary();

  const alex = {
    id: STUDENT.id,
    name: 'Alex',
    track: STUDENT.track,
    completed: Object.values(STUDENT.completedCfu).reduce((s, v) => s + v, 0),
    planned: total,
    status: submission,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warnings: alerts.filter((a) => a.severity === 'warning').length,
    live: true,
  };
  const advisees = [alex, ...SAMPLE_ADVISEES];
  const count = (status) => advisees.filter((a) => a.status === status).length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">My Advisees</h2>
        <p className="text-sm text-slate-600">Study plans of the students you supervise this semester. Open a plan to review and approve it.</p>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3" data-tour="advisee-stats">
        {[
          ['Students', advisees.length, 'text-slate-900'],
          ['Awaiting review', count('submitted'), 'text-amber-700'],
          ['With critical issues', advisees.filter((a) => a.critical > 0).length, 'text-red-700'],
          ['Approved', count('approved'), 'text-green-700'],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className={`text-2xl font-bold tabular-nums ${color}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto scrollbar-thin" data-tour="advisees">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="text-left font-medium px-4 py-2.5">Student</th>
              <th scope="col" className="text-left font-medium px-4 py-2.5">Completed</th>
              <th scope="col" className="text-left font-medium px-4 py-2.5">This semester</th>
              <th scope="col" className="text-left font-medium px-4 py-2.5">Agent findings</th>
              <th scope="col" className="text-left font-medium px-4 py-2.5">Status</th>
              <th scope="col" className="px-4 py-2.5">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {advisees.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.track} track{!a.live && ' · sample record'}
                  </p>
                </td>
                <td className="px-4 py-3 tabular-nums">{a.completed}/180 CFU</td>
                <td className="px-4 py-3 tabular-nums">{a.planned} CFU planned</td>
                <td className="px-4 py-3">
                  {a.critical > 0 && <span className="whitespace-nowrap text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full mr-1">{a.critical} critical</span>}
                  {a.warnings > 0 && <span className="whitespace-nowrap text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{a.warnings} warning{a.warnings > 1 ? 's' : ''}</span>}
                  {!a.critical && !a.warnings && <span className="text-xs text-green-700">No issues</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_PILLS[a.status].className}`}>{STATUS_PILLS[a.status].label}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {a.live ? (
                    <button
                      onClick={() => setTab('review')}
                      className="whitespace-nowrap inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                    >
                      Review plan <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Demo only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Alex's row is live: it updates as soon as Alex changes the plan in the Student view. The other rows are sample records for the demo.
      </p>
    </div>
  );
}
