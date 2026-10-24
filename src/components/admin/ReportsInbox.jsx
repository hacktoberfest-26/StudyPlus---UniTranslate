import { Inbox, Check } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { ROLES } from '../../brain/student.js';

const TYPE_LABELS = {
  bug: 'Bug',
  confusing: 'Confusing',
  accessibility: 'Accessibility',
  idea: 'Idea',
  message: 'Message',
};
const SEVERITY = {
  blocking: { label: 'Stops them', className: 'bg-red-100 text-red-700' },
  annoying: { label: 'Slows them down', className: 'bg-amber-100 text-amber-800' },
  minor: { label: 'Minor', className: 'bg-slate-100 text-slate-700' },
};

const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Bug reports and messages sent from Help & feedback by any user. */
export function ReportsInbox() {
  const reports = usePlanStore((s) => s.reports);
  const resolveReport = usePlanStore((s) => s.resolveReport);
  const openPanel = usePlanStore((s) => s.openPanel);
  const open = reports.filter((r) => r.status === 'open').length;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl w-full">
      <div className="flex flex-wrap items-end justify-between gap-3" data-tour="reports">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reports & feedback</h2>
          <p className="text-sm text-slate-600">
            Problems and messages sent through Help & feedback · {open} open, {reports.length - open} resolved
          </p>
        </div>
        <button onClick={() => openPanel('help', 'bug')} className="text-sm font-medium text-blue-600 hover:underline">
          Send a test report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <Inbox className="w-10 h-10 mx-auto text-slate-400" aria-hidden />
          <p className="mt-2 text-slate-700">No reports yet. Anything users send from Help & feedback appears here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {[...reports].reverse().map((r) => (
            <li key={r.id} className={`bg-white border rounded-2xl p-4 ${r.status === 'open' ? 'border-slate-200' : 'border-slate-200 opacity-80'}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-slate-500">{r.id}</span>
                <span className="font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{TYPE_LABELS[r.type] ?? r.type}</span>
                {r.severity && <span className={`font-medium px-2 py-0.5 rounded-full ${SEVERITY[r.severity].className}`}>{SEVERITY[r.severity].label}</span>}
                <span className={`font-medium px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                  {r.status === 'open' ? 'Open' : 'Resolved'}
                </span>
                <span className="text-slate-500 ml-auto">{when(r.at)}</span>
              </div>
              <p className="mt-2 text-slate-900">{r.details}</p>
              {r.expected && <p className="mt-1 text-sm text-slate-600">Expected: {r.expected}</p>}
              <p className="mt-2 text-xs text-slate-500">
                From {r.contact || r.from} ({ROLES[r.role]?.label ?? 'signed out'}){r.where ? ` · on ${r.where}` : ''}
                {r.attachment ? ` · attachment: ${r.attachment}` : ''}
              </p>
              {r.technical && <p className="mt-1 text-xs font-mono text-slate-500 break-all">{r.technical}</p>}
              {r.status === 'open' && (
                <button
                  onClick={() => resolveReport(r.id)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg"
                >
                  <Check className="w-4 h-4" aria-hidden /> Mark as resolved
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
