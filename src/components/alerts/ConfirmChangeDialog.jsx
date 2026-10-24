import { useEffect, useRef } from 'react';
import { TriangleAlert, CircleAlert, CircleCheck, Info } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useCatalogIndex } from '../../store/derived.js';
import { formatSchedule } from '../../librarian/schedule.js';
import { Modal } from '../ui/primitives.jsx';

const TONES = {
  critical: { Icon: TriangleAlert, row: 'bg-red-50 text-red-800', icon: 'text-red-600', label: 'Conflict' },
  warning: { Icon: CircleAlert, row: 'bg-amber-50 text-amber-900', icon: 'text-amber-600', label: 'Warning' },
  positive: { Icon: CircleCheck, row: 'bg-green-50 text-green-800', icon: 'text-green-600', label: 'Improvement' },
  info: { Icon: Info, row: 'bg-slate-50 text-slate-700', icon: 'text-slate-500', label: 'Info' },
};
const ORDER = { critical: 0, warning: 1, info: 2, positive: 3 };

/** Asks the user to confirm a plan change, listing what it will cause. */
export function ConfirmChangeDialog() {
  const pending = usePlanStore((s) => s.pendingChange);
  const confirm = usePlanStore((s) => s.confirmPendingChange);
  const cancel = usePlanStore((s) => s.cancelPendingChange);
  const index = useCatalogIndex();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (pending) cancelRef.current?.focus();
  }, [pending]);

  if (!pending) return null;
  const { change, effects } = pending;
  const courses = change.codes.map((c) => index[c]).filter(Boolean);
  const hasConflict = effects.some((e) => e.tone === 'critical');
  const hasWarning = effects.some((e) => e.tone === 'warning');

  let title;
  let confirmLabel;
  if (change.kind === 'remove') {
    title = `Drop "${courses[0]?.title}"?`;
    confirmLabel = 'Drop course';
  } else if (change.kind === 'swap') {
    title = `Swap "${courses[0]?.title}" for "${courses[1]?.title}"?`;
    confirmLabel = 'Apply swap';
  } else {
    title = courses.length === 1 ? `Add "${courses[0]?.title}"?` : `Add ${courses.length} courses?`;
    confirmLabel = hasConflict || hasWarning ? 'Add anyway' : 'Add to plan';
  }
  const confirmClass =
    change.kind === 'remove' || hasConflict ? 'bg-red-600 hover:bg-red-700' : hasWarning ? 'bg-amber-700 hover:bg-amber-800' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <Modal title={title} onClose={cancel}>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Please confirm</p>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">{title}</h2>
          <ul className="mt-2 space-y-0.5">
            {courses.map((c) => (
              <li key={c.code} className="text-sm text-slate-600">
                <span className="font-mono text-xs text-slate-500">{c.code}</span> · {c.cfu} CFU · {formatSchedule(c)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">What this will do</h3>
          {effects.length ? (
            <ul className="space-y-2">
              {[...effects]
                .sort((a, b) => ORDER[a.tone] - ORDER[b.tone])
                .map((e, i) => {
                  const t = TONES[e.tone] ?? TONES.info;
                  return (
                    <li key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${t.row}`}>
                      <t.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${t.icon}`} aria-label={t.label} />
                      <span>{e.text}</span>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No other courses, credits or alerts are affected.</p>
          )}
        </div>

        {hasConflict && (
          <p className="text-xs text-red-700">
            If you continue, a critical alert will stay on screen until the overlap is resolved, and the plan can't be submitted until then.
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <button
            ref={cancelRef}
            onClick={cancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
