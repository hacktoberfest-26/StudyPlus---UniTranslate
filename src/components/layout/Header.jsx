import { GraduationCap, ClipboardCheck, Database, Compass, CircleHelp, CircleCheck, CircleAlert } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useAlerts } from '../../store/derived.js';
import { AccountMenu } from './AccountMenu.jsx';

/** Visual identity of each workspace, so the interfaces are easy to tell apart. */
const WORKSPACES = {
  newcomer: { title: 'Find your path', logo: 'from-amber-500 to-orange-600', Icon: Compass },
  student: { title: 'Student', logo: 'from-blue-600 to-indigo-600', Icon: GraduationCap },
  advisor: { title: 'Advisor', logo: 'from-emerald-600 to-teal-700', Icon: ClipboardCheck },
  admin: { title: 'Department', logo: 'from-ink-700 to-ink-900', Icon: Database },
};

const SUBMISSION_LABELS = {
  draft: 'Draft',
  submitted: 'Waiting for your advisor',
  approved: 'Approved',
  changes: 'Changes requested',
};

function formatSavedAt(iso) {
  if (!iso) return '10:24';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/** One short line of status per role, instead of a full banner. */
function StatusChip() {
  const role = usePlanStore((s) => s.role);
  const submission = usePlanStore((s) => s.submission);
  const lastSavedAt = usePlanStore((s) => s.lastSavedAt);
  const ingested = usePlanStore((s) => !!s.ingestReport);
  const openReports = usePlanStore((s) => s.reports.filter((r) => r.status === 'open').length);
  const shortlist = usePlanStore((s) => s.shortlist.length);
  const setTab = usePlanStore((s) => s.setTab);
  const critical = useAlerts().filter((a) => a.severity === 'critical').length;

  let text;
  let warn = false;
  let target = null;
  if (role === 'student') {
    warn = critical > 0;
    text = warn ? `${critical} clash${critical > 1 ? 'es' : ''} to fix · saved ${formatSavedAt(lastSavedAt)}` : `${SUBMISSION_LABELS[submission]} · saved ${formatSavedAt(lastSavedAt)}`;
    target = 'home';
  } else if (role === 'advisor') {
    warn = submission === 'submitted';
    text = warn ? '1 plan to review' : 'No plans waiting';
    target = 'review';
  } else if (role === 'admin') {
    warn = openReports > 0 || !ingested;
    text = [openReports ? `${openReports} open report${openReports > 1 ? 's' : ''}` : null, ingested ? null : '3 records to import'].filter(Boolean).join(' · ') || 'All up to date';
    target = openReports ? 'reports' : 'courses';
  } else {
    text = shortlist ? `${shortlist} route${shortlist > 1 ? 's' : ''} saved` : 'No routes saved yet';
    target = 'shortlist';
  }
  const Icon = warn ? CircleAlert : CircleCheck;

  return (
    <button
      onClick={() => setTab(target)}
      data-tour="status"
      className={`hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
        warn ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden />
      {text}
    </button>
  );
}

export function Header() {
  const role = usePlanStore((s) => s.role);
  const openPanel = usePlanStore((s) => s.openPanel);
  const workspace = WORKSPACES[role];

  return (
    <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 shrink-0 bg-gradient-to-br ${workspace.logo} rounded-lg flex items-center justify-center`}>
          <workspace.Icon className="w-5 h-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0 leading-tight">
          <h1 className="text-lg font-bold text-slate-900">UniTranslate</h1>
          <p className="text-xs font-medium text-slate-500 truncate">{workspace.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusChip />
        <button
          onClick={() => openPanel('help', 'contact')}
          data-tour="help"
          className="p-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Help and feedback"
          title="Help and feedback"
        >
          <CircleHelp className="w-5 h-5" aria-hidden />
        </button>
        <AccountMenu />
      </div>
    </div>
  );
}
