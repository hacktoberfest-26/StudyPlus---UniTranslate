import { TriangleAlert, CircleAlert, Lightbulb, Info, ShieldCheck } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useAlerts } from '../../store/derived.js';

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
  if (kind === 'swap') return 'bg-green-600 hover:bg-green-700 text-white';
  if (kind === 'drop') return primary ? 'bg-slate-700 hover:bg-slate-800 text-white' : 'border border-slate-400 text-slate-700 hover:bg-white';
  return 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400';
}

function AlertCard({ alert }) {
  const runAlertAction = usePlanStore((s) => s.runAlertAction);
  const style = STYLES[alert.severity];
  const { Icon } = style;

  return (
    <li className={`rounded-lg p-3 ${style.card}`} role={alert.severity === 'critical' ? 'alert' : undefined}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.icon}`}>
          <Icon className="w-4 h-4" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm ${style.title}`}>{alert.title}</h4>
          <p className={`text-xs mt-1 ${style.body}`}>{alert.message}</p>
          {alert.severity === 'critical' && (
            <p className="text-[11px] text-red-700 mt-1 italic">This alert stays until the overlap is resolved.</p>
          )}
          {alert.actions.length > 0 && (
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

  return (
    <aside
      aria-label="H-OS Agent Alerts"
      data-tour="alerts"
      className="lg:w-80 xl:w-96 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col lg:min-h-0"
    >
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
            <h3 className={`font-semibold ${critical ? 'text-red-900' : 'text-slate-900'}`}>H-OS Agent Alerts</h3>
            <p className="text-xs text-slate-500">Management by exception · live</p>
          </div>
          {actionable > 0 && (
            <span className={`ml-auto text-xs text-white px-2 py-0.5 rounded-full ${critical ? 'bg-red-600' : 'bg-amber-500'}`}>
              {actionable} Action{actionable > 1 ? 's' : ''} Required
            </span>
          )}
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 max-h-80 lg:max-h-none" aria-live="polite">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </ul>
    </aside>
  );
}
