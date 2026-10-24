import { TriangleAlert, CircleAlert, Lightbulb, Info, ShieldCheck } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useAlerts } from '../../store/derived.js';
import { usePrefsStore, DEFAULT_PREFS } from '../../store/usePrefsStore.js';
import { ResizeHandle } from '../ui/resize.jsx';

const STYLES = {
  critical: {
    card: 'bg-red-50 border-2 border-red-500 shadow-sm',
    icon: 'bg-red-500 text-white animate-pulse',
    title: 'text-red-900 font-bold',
    body: 'text-red-800 font-medium',
    Icon: TriangleAlert,
  },
  warning: {
    card: 'bg-amber-50 border border-amber-300',
    icon: 'bg-amber-100 text-amber-600',
    title: 'text-amber-900 font-semibold',
    body: 'text-amber-800',
    Icon: CircleAlert,
  },
  success: {
    card: 'bg-green-50 border border-green-300',
    icon: 'bg-green-100 text-green-600',
    title: 'text-green-900 font-semibold',
    body: 'text-green-800',
    Icon: Lightbulb,
  },
  info: {
    card: 'bg-sky-50 border border-sky-200',
    icon: 'bg-sky-100 text-sky-600',
    title: 'text-sky-900 font-semibold',
    body: 'text-sky-800',
    Icon: Info,
  },
};

function actionClass(kind, primary) {
  if (kind === 'swap') return 'bg-green-700 hover:bg-green-800 text-white';
  if (kind === 'drop') return primary ? 'bg-ink-700 hover:bg-ink-800 text-white' : 'border border-slate-400 text-slate-700 hover:bg-white';
  return 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400';
}

/** One agent alert. `readOnly` hides the fix buttons (used in the advisor's review). */
export function AlertCard({ alert, readOnly = false }) {
  const runAlertAction = usePlanStore((s) => s.runAlertAction);
  const style = STYLES[alert.severity];
  const { Icon } = style;

  return (
    <li className={`rounded-lg p-3 ${style.card}`}>
      <div className="flex items-start gap-3" role={alert.severity === 'critical' ? 'alert' : undefined}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.icon}`}>
          <Icon className="w-4 h-4" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm ${style.title}`}>{alert.title}</h4>
          <p className={`text-xs mt-1 ${style.body}`}>{alert.message}</p>
          {alert.severity === 'critical' && (
            <p className="text-[11px] text-red-700 mt-1 italic">
              {readOnly ? 'The plan cannot be approved while this overlap remains.' : 'This alert stays until the overlap is resolved.'}
            </p>
          )}
          {!readOnly && alert.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {alert.actions.map((action, i) => (
                <button
                  key={`${action.kind}-${i}`}
                  onClick={() => runAlertAction(action)}
                  className={`flex-1 min-w-fit text-xs font-medium py-1.5 px-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${actionClass(
                    action.kind,
                    alert.severity === 'critical',
                  )}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Sticky, non-dismissable agent panel. There is intentionally no close control:
 * alerts are recomputed from the plan and disappear only when their cause is fixed.
 */
export function ProactiveAlerts() {
  const alerts = useAlerts();
  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const actionable = alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length;
  const width = usePrefsStore((s) => s.alertsWidth);
  const setPref = usePrefsStore((s) => s.setPref);

  // On wide screens the panel sticks below the tab bar while the page scrolls, and its width can be dragged.
  return (
    <aside
      aria-label="Plan alerts"
      data-tour="alerts"
      style={{ '--alerts-w': `${width}px` }}
      className="relative lg:w-(--alerts-w) shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col lg:sticky lg:top-(--sticky-top) lg:max-h-[calc(100vh-var(--sticky-top))]"
    >
      <ResizeHandle
        value={width}
        min={260}
        max={560}
        onChange={(w) => setPref('alertsWidth', w)}
        onReset={() => setPref('alertsWidth', DEFAULT_PREFS.alertsWidth)}
        label="Resize alerts panel"
        className="hidden lg:flex absolute top-0 -right-1.5 w-3 h-full z-20"
      />
      <div className={`p-3 border-b border-slate-200 ${critical ? 'bg-red-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              critical ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
            }`}
          >
            {critical ? <TriangleAlert className="w-5 h-5 text-white" aria-hidden /> : <ShieldCheck className="w-5 h-5 text-white" aria-hidden />}
          </div>
          <div>
            <h3 className={`font-semibold ${critical ? 'text-red-900' : 'text-slate-900'}`}>Plan alerts</h3>
            <p className="text-xs text-slate-500">Checked automatically as you plan</p>
          </div>
          {actionable > 0 && (
            <span className={`ml-auto text-xs text-white px-2 py-0.5 rounded-full ${critical ? 'bg-red-600' : 'bg-amber-700'}`}>
              {actionable} Action{actionable > 1 ? 's' : ''} Required
            </span>
          )}
        </div>
      </div>
      <ul className="p-3 space-y-3 lg:flex-1 lg:min-h-0 lg:overflow-y-auto scrollbar-thin" aria-live="polite">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </ul>
    </aside>
  );
}
