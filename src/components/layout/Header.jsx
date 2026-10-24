import { GraduationCap, CircleCheck, ChevronDown, RotateCcw, CircleHelp, ClipboardCheck, Database } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { ROLES } from '../../brain/student.js';
import { DisplaySettingsButton } from './DisplaySettings.jsx';

/** Visual identity of each role's workspace, so the three interfaces are easy to tell apart. */
const WORKSPACES = {
  student: { title: 'Student workspace · Alex', logo: 'from-blue-600 to-indigo-600', Icon: GraduationCap },
  advisor: { title: 'Advisor workspace · Prof. Rossi', logo: 'from-emerald-600 to-teal-600', Icon: ClipboardCheck },
  admin: { title: 'Admin workspace · Department office', logo: 'from-ink-700 to-ink-900', Icon: Database },
};

const SUBMISSION_LABELS = {
  draft: { label: 'Active Draft', className: 'text-blue-600' },
  submitted: { label: 'Submitted for Advisor Review', className: 'text-amber-600' },
  approved: { label: 'Approved by Prof. Rossi', className: 'text-green-600' },
  changes: { label: 'Changes Requested', className: 'text-red-600' },
};

function formatSavedAt(iso) {
  if (!iso) return '10:24 AM';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function Header() {
  const role = usePlanStore((s) => s.role);
  const setRole = usePlanStore((s) => s.setRole);
  const lastSavedAt = usePlanStore((s) => s.lastSavedAt);
  const submission = usePlanStore((s) => s.submission);
  const resetDemo = usePlanStore((s) => s.resetDemo);
  const startTour = usePlanStore((s) => s.startTour);
  const status = SUBMISSION_LABELS[submission];
  const catalogSize = usePlanStore((s) => s.catalog.length);
  const ingested = usePlanStore((s) => !!s.ingestReport);
  const workspace = WORKSPACES[role];

  return (
    <div className="px-4 sm:px-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 shrink-0 bg-gradient-to-br ${workspace.logo} rounded-lg flex items-center justify-center`}>
            <workspace.Icon className="w-6 h-6 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              StudyPlus UniTranslate <span className="font-medium text-slate-500">(H-OS Academic Module)</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">{workspace.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex items-center gap-2" data-tour="role">
            <span className="hidden md:inline whitespace-nowrap text-xs font-medium text-slate-500">View as</span>
            <select
              id="role-switcher"
              aria-label="View as"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="appearance-none bg-slate-100 border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {Object.entries(ROLES).map(([id, r]) => (
                <option key={id} value={id}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
          </label>
          <DisplaySettingsButton />
          <button
            onClick={startTour}
            data-tour="help"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <CircleHelp className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Tour</span>
            <span className="sr-only sm:hidden">Start the guided tour</span>
          </button>
          <button
            onClick={resetDemo}
            title="Reset demo data"
            aria-label="Reset demo data"
            className="p-2 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RotateCcw className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      <div data-tour="autosave" className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg" role="status">
        <CircleCheck className="w-4 h-4 text-green-600 shrink-0" aria-hidden />
        {role === 'student' && (
          <span>
            Draft saved automatically at {formatSavedAt(lastSavedAt)} • Status: <span className={`font-semibold ${status.className}`}>{status.label}</span>
          </span>
        )}
        {role === 'advisor' && (
          <span>
            {submission === 'submitted' ? '1 plan awaiting your review' : 'No plans awaiting your review'} • Alex's plan:{' '}
            <span className={`font-semibold ${status.className}`}>{status.label}</span>
          </span>
        )}
        {role === 'admin' && (
          <span>
            {catalogSize} courses in the Brain • Librarian ingestion: <span className="font-semibold text-slate-800">{ingested ? 'feed processed' : '3 records waiting'}</span>
          </span>
        )}
      </div>
    </div>
  );
}
