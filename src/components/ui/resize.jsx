/**
 * Resizing primitives: a drag handle (mouse, touch, pen and keyboard), a zoom control,
 * and resizable table header cells.
 */
import { createContext, useContext, useRef } from 'react';
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

const BoxSizeContext = createContext({ width: null, height: null });

/** The user-chosen size of the nearest ResizableBox (null = automatic). */
export function useBoxSize() {
  return useContext(BoxSizeContext);
}

/**
 * A frame the user can resize from its right edge (width), bottom edge (height) or
 * bottom-right corner (both). The inside is a CSS size container, so content can adapt
 * with @container variants, and it scrolls when the content is larger than the frame.
 * Sizes are remembered per device; double-click a grip or use "Reset size" to restore.
 */
export function ResizableBox({ id, label, children, minWidth = 280, minHeight = 200, defaultWidth = '100%', defaultHeight = 'auto', className = '', innerClassName = '' }) {
  const saved = usePrefsStore((s) => s.boxSizes[id]);
  const setBoxSize = usePrefsStore((s) => s.setBoxSize);
  const resetBoxSize = usePrefsStore((s) => s.resetBoxSize);
  const ref = useRef(null);
  const drag = useRef(null);
  const width = saved?.w ?? null;
  const height = saved?.h ?? null;

  const maxWidth = () => ref.current?.parentElement?.clientWidth ?? Infinity;

  const begin = (axis) => (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = ref.current.getBoundingClientRect();
    drag.current = { axis, x: e.clientX, y: e.clientY, w: rect.width, h: rect.height, max: maxWidth() };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const next = {};
    if (d.axis !== 'y') {
      const w = clamp(Math.round(d.w + e.clientX - d.x), minWidth, d.max);
      // Dragging back to the full width returns the frame to "automatic" so it keeps filling the page.
      next.w = w >= d.max - 4 ? null : w;
    }
    if (d.axis !== 'x') next.h = clamp(Math.round(d.h + e.clientY - d.y), minHeight, 4000);
    setBoxSize(id, next);
  };
  const end = (e) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const onKey = (axis) => (e) => {
    const rect = ref.current.getBoundingClientRect();
    const step = e.shiftKey ? 80 : 24;
    if (axis === 'x' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const max = maxWidth();
      const w = clamp(Math.round(rect.width + (e.key === 'ArrowRight' ? step : -step)), minWidth, max);
      setBoxSize(id, { w: w >= max - 4 ? null : w });
    } else if (axis === 'y' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setBoxSize(id, { h: clamp(Math.round(rect.height + (e.key === 'ArrowDown' ? step : -step)), minHeight, 4000) });
    } else if (e.key === 'Home') {
      e.preventDefault();
      resetBoxSize(id);
    }
  };
  const handlers = (axis) => ({
    onPointerDown: begin(axis),
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
    onDoubleClick: () => resetBoxSize(id),
  });
  const grip = 'touch-none select-none absolute z-20 flex items-center justify-center group focus:outline-none';
  const pill = 'rounded-full bg-slate-300 group-hover:bg-blue-500 group-focus-visible:bg-blue-500 group-active:bg-blue-600 transition-colors';

  return (
    <BoxSizeContext.Provider value={{ width, height }}>
      <div
        ref={ref}
        className={`relative max-w-full ${className}`}
        style={{ width: width != null ? `${width}px` : defaultWidth, height: height != null ? `${height}px` : defaultHeight }}
      >
        <div className={`@container h-full overflow-auto scrollbar-thin ${innerClassName}`} tabIndex={0} role="region" aria-label={label}>
          {children}
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`${label}: width`}
          aria-valuenow={Math.round(width ?? ref.current?.offsetWidth ?? 0)}
          tabIndex={0}
          title="Drag to change the width · double-click to reset"
          onKeyDown={onKey('x')}
          {...handlers('x')}
          className={`${grip} !items-start top-0 -right-2 w-4 h-full cursor-ew-resize`}
        >
          {/* The grip rides along with the page, so it stays visible on frames taller than the screen. */}
          <span className={`${pill} w-1.5 h-12 sticky top-[calc(50vh-1.5rem)] mt-[min(50%,calc(50vh-1.5rem))]`} />
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label={`${label}: height`}
          aria-valuenow={Math.round(height ?? ref.current?.offsetHeight ?? 0)}
          tabIndex={0}
          title="Drag to change the height · double-click to reset"
          onKeyDown={onKey('y')}
          {...handlers('y')}
          className={`${grip} left-0 -bottom-2 h-4 w-full cursor-ns-resize`}
        >
          <span className={`${pill} h-1.5 w-12`} />
        </div>
        <div
          aria-hidden
          title="Drag to resize · double-click to reset"
          {...handlers('xy')}
          className={`${grip} -right-1 -bottom-1 w-6 h-6 cursor-nwse-resize`}
        >
          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" aria-hidden>
            <path d="M11 4 4 11M11 8 8 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>
      {(width != null || height != null) && (
        <div className="flex justify-end mt-3" style={{ width: width != null ? `${width}px` : undefined, maxWidth: '100%' }}>
          <button onClick={() => resetBoxSize(id)} className="text-xs font-medium text-blue-600 hover:underline">
            Reset size
          </button>
        </div>
      )}
    </BoxSizeContext.Provider>
  );
}
