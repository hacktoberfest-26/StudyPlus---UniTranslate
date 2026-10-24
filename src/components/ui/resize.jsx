/**
 * Resizing primitives: a drag handle (mouse, touch, pen and keyboard), a zoom control,
 * and resizable table header cells.
 */
import { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { usePrefsStore } from '../../store/usePrefsStore.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Vertical drag handle. Calls onChange with the new size while dragging.
 * Keyboard: ←/→ adjust by `step`, Home resets. Double-click / double-tap resets.
 */
export function ResizeHandle({ value, min, max, onChange, onReset, label, step = 16, className = '' }) {
  const start = useRef(null);

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, value };
  };
  const onPointerMove = (e) => {
    if (!start.current) return;
    onChange(clamp(Math.round(start.current.value + e.clientX - start.current.x), min, max));
  };
  const onPointerUp = (e) => {
    start.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(clamp(value + (e.key === 'ArrowRight' ? step : -step), min, max));
    } else if (e.key === 'Home' && onReset) {
      e.preventDefault();
      onReset();
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title={`${label}: drag, or use ← → keys. Double-click to reset.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
      className={`group touch-none select-none cursor-col-resize flex justify-center focus:outline-none ${className}`}
    >
      <span className="w-0.5 h-full bg-slate-300/70 group-hover:bg-blue-500 group-focus-visible:bg-blue-500 group-active:bg-blue-600 transition-colors rounded" />
    </div>
  );
}

/** −  [slider]  +  with a reset/fit button. */
export function ZoomControl({ label, value, min, max, step, onChange, format = (v) => `${Math.round(v * 100)}%`, resetLabel = 'Reset', onReset, id }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-slate-600" role="group" aria-label={label}>
      <span className="font-medium hidden sm:inline">{label}</span>
      <button
        onClick={() => onChange(clamp(+(value - step).toFixed(2), min, max))}
        disabled={value <= min}
        className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
        aria-label={`${label}: smaller`}
      >
        <Minus className="w-3.5 h-3.5" aria-hidden />
      </button>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={format(value)}
        className="w-24 sm:w-32 accent-blue-600"
      />
      <button
        onClick={() => onChange(clamp(+(value + step).toFixed(2), min, max))}
        disabled={value >= max}
        className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
        aria-label={`${label}: larger`}
      >
        <Plus className="w-3.5 h-3.5" aria-hidden />
      </button>
      <span className="w-10 text-right tabular-nums">{format(value)}</span>
      {onReset && (
        <button onClick={onReset} className="px-2 py-1 rounded-md text-blue-600 hover:bg-blue-50 font-medium">
          {resetLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Column widths for a table, remembered per device.
 * @param defaults { [columnId]: px }
 */
export function useColumnWidths(tableId, defaults) {
  const saved = usePrefsStore((s) => s.columnWidths[tableId]);
  const setColumnWidth = usePrefsStore((s) => s.setColumnWidth);
  const resetColumnWidths = usePrefsStore((s) => s.resetColumnWidths);
  const widths = { ...defaults, ...saved };
  const total = Object.keys(defaults).reduce((sum, k) => sum + widths[k], 0);
  return {
    widths,
    total,
    customised: !!saved,
    setWidth: (col, w) => setColumnWidth(tableId, col, w),
    resetColumn: (col) => setColumnWidth(tableId, col, defaults[col]),
    resetAll: () => resetColumnWidths(tableId),
  };
}

/** Header cell with a drag handle on its right edge. */
export function ResizableTh({ id, label, cols, className = '', children }) {
  return (
    <th scope="col" className={`relative font-medium px-3 py-2 ${className}`} style={{ width: cols.widths[id] }}>
      <span className="block truncate" title={typeof label === 'string' ? label : undefined}>
        {children ?? label}
      </span>
      <ResizeHandle
        value={cols.widths[id]}
        min={56}
        max={640}
        step={20}
        onChange={(w) => cols.setWidth(id, w)}
        onReset={() => cols.resetColumn(id)}
        label={`Resize ${typeof label === 'string' && label ? label : 'column'} column`}
        className="absolute top-0 -right-1.5 w-3 h-full z-10"
      />
    </th>
  );
}

/** "Reset column widths" link, shown only once a table has been resized. */
export function ResetColumnsButton({ cols }) {
  if (!cols.customised) return null;
  return (
    <button onClick={cols.resetAll} className="text-xs font-medium text-blue-600 hover:underline">
      Reset column widths
    </button>
  );
}
