import { useState } from 'react';
import { Accessibility, Monitor, Sun, Moon, X, TriangleAlert, CircleAlert, CircleCheck } from 'lucide-react';
import { usePrefsStore } from '../../store/usePrefsStore.js';
import { COURSE_TYPES } from '../../brain/courses.js';
import { Modal } from '../ui/primitives.jsx';

function Segmented({ label, value, options, onChange, name }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-900 mb-1.5">{label}</legend>
      <div className="grid gap-1 bg-slate-100 rounded-lg p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup">
        {options.map(({ id, text, Icon }) => (
          <button
            key={id}
            id={`${name}-${id}`}
            role="radio"
            aria-checked={value === id}
            onClick={() => onChange(id)}
            className={`inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
              value === id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-300' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" aria-hidden />}
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({ id, label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p id={`${id}-label`} className="text-sm font-semibold text-slate-900">
          {label}
        </p>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}

/** Live sample of the status colours and course-type patterns, so changes are visible at once. */
function Preview() {
  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2" aria-label="Preview">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          <TriangleAlert className="w-3.5 h-3.5" aria-hidden /> Critical
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
          <CircleAlert className="w-3.5 h-3.5" aria-hidden /> Warning
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          <CircleCheck className="w-3.5 h-3.5" aria-hidden /> No issues
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Object.entries(COURSE_TYPES).map(([id, t]) => (
          <span key={id} className={`${t.block} type-${id} text-white text-[11px] font-medium rounded-md px-1.5 py-2 text-center`}>
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DisplaySettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-tour="a11y"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="dialog"
      >
        <Accessibility className="w-4 h-4" aria-hidden />
        <span className="hidden sm:inline">Display</span>
        <span className="sr-only sm:hidden">Display and accessibility settings</span>
      </button>
      {open && <DisplaySettings onClose={() => setOpen(false)} />}
    </>
  );
}

function DisplaySettings({ onClose }) {
  const prefs = usePrefsStore();
  const { setPref, resetPrefs } = prefs;

  return (
    <Modal title="Display and accessibility" onClose={onClose}>
      <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-blue-600" aria-hidden /> Display & accessibility
          </h2>
          <p className="text-sm text-slate-600">Saved on this device only.</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Close display settings">
          <X className="w-5 h-5 text-slate-600" aria-hidden />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <Segmented
          label="Theme"
          name="theme"
          value={prefs.theme}
          onChange={(v) => setPref('theme', v)}
          options={[
            { id: 'system', text: 'System', Icon: Monitor },
            { id: 'light', text: 'Light', Icon: Sun },
            { id: 'dark', text: 'Dark', Icon: Moon },
          ]}
        />

        <div className="space-y-1.5">
          <Segmented
            label="Colour vision"
            name="cvd"
            value={prefs.colorVision}
            onChange={(v) => setPref('colorVision', v)}
            options={[
              { id: 'default', text: 'Standard' },
              { id: 'safe', text: 'Colour-blind friendly' },
            ]}
          />
          <p className="text-xs text-slate-600">
            Uses a palette that stays distinct with red-green and blue-yellow colour blindness, and adds patterns to calendar blocks and the progress bar.
          </p>
        </div>

        <Segmented
          label="Text size"
          name="text-size"
          value={prefs.textSize}
          onChange={(v) => setPref('textSize', v)}
          options={[
            { id: 'normal', text: 'Default' },
            { id: 'large', text: 'Large' },
            { id: 'larger', text: 'Larger' },
          ]}
        />

        <div className="space-y-4">
          <Toggle
            id="pref-contrast"
            label="High contrast"
            description="Darker text, stronger borders, underlined links and a thicker focus outline."
            checked={prefs.highContrast}
            onChange={(v) => setPref('highContrast', v)}
          />
          <Toggle
            id="pref-motion"
            label="Reduce motion"
            description="Stops flashing, pulsing and sliding animations."
            checked={prefs.reduceMotion}
            onChange={(v) => setPref('reduceMotion', v)}
          />
          <Toggle
            id="pref-font"
            label="Readable font"
            description="Switches to Atkinson Hyperlegible, a typeface designed for low-vision readers, with more line spacing."
            checked={prefs.readableFont}
            onChange={(v) => setPref('readableFont', v)}
          />
        </div>

        <Preview />

        <div className="flex justify-between gap-2 pt-1">
          <button onClick={resetPrefs} className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            Reset to defaults
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
