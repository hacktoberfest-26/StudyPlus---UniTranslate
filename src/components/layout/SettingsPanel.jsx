import { useState } from 'react';
import { X, User, Bell, Globe, CalendarSync, Shield, Accessibility, Inbox, KeyRound, Download, Trash2 } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { ROLES, STUDENT } from '../../brain/student.js';
import { Modal } from '../ui/primitives.jsx';

const SECTIONS = [
  ['account', 'Account & profile', User],
  ['notifications', 'Notifications', Bell],
  ['language', 'Language & region', Globe],
  ['calendar', 'Calendar sync', CalendarSync],
  ['privacy', 'Privacy & data', Shield],
  ['requests', 'My support requests', Inbox],
];

const field = 'mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function Switch({ id, label, description, defaultChecked }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p id={`${id}-label`} className="text-sm font-medium text-slate-900">
          {label}
        </p>
        {description && <p className="text-xs text-slate-600">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={on}
        aria-labelledby={`${id}-label`}
        onClick={() => setOn(!on)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function PrototypeNote() {
  return <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">Prototype: these settings show what will be available. Changes here are not saved yet.</p>;
}

function AccountSection() {
  const session = usePlanStore((s) => s.session);
  const role = usePlanStore((s) => s.role);
  const toast = usePlanStore((s) => s.toast);
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Name</span>
        <input id="settings-name" defaultValue={session?.name} className={field} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input id="settings-email" type="email" defaultValue={session?.email} className={field} />
      </label>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Account type</dt>
          <dd className="text-slate-900">{ROLES[role].label}</dd>
        </div>
        {role === 'student' && (
          <div>
            <dt className="text-xs text-slate-500">Programme</dt>
            <dd className="text-slate-900">
              {STUDENT.programme} · {STUDENT.track}
            </dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap gap-2 pt-1">
        <button onClick={() => toast('Profile changes are not saved in this prototype.')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Save changes
        </button>
        <button
          onClick={() => toast('Password change is not available in this prototype.')}
          className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-lg"
        >
          <KeyRound className="w-4 h-4" aria-hidden /> Change password
        </button>
      </div>
      <PrototypeNote />
    </div>
  );
}

function NotificationsSection() {
  const role = usePlanStore((s) => s.role);
  return (
    <div className="divide-y divide-slate-100">
      {role === 'student' && <Switch id="n-clash" label="Timetable clashes" description="When a change to your plan creates an overlap." defaultChecked />}
      {role === 'student' && <Switch id="n-advisor" label="Advisor decisions" description="When your plan is approved or changes are requested." defaultChecked />}
      {role === 'advisor' && <Switch id="n-submitted" label="New plans to review" description="When one of your students submits a plan." defaultChecked />}
      {role === 'admin' && <Switch id="n-reports" label="New bug reports" description="When someone reports a problem with the site." defaultChecked />}
      {role === 'newcomer' && <Switch id="n-deadlines" label="Application deadlines" description="Reminders for programmes on your shortlist." defaultChecked />}
      <Switch id="n-email" label="Email notifications" description="Send a copy of important notifications to your inbox." defaultChecked />
      <Switch id="n-digest" label="Weekly summary" description="One email every Monday with what changed." />
      <div className="pt-3">
        <PrototypeNote />
      </div>
    </div>
  );
}

function LanguageSection() {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Language</span>
        <select id="settings-language" defaultValue="en" className={field}>
          <option value="en">English</option>
          <option value="it">Italiano (coming soon)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Time format</span>
        <select id="settings-time" defaultValue="24" className={field}>
          <option value="24">24-hour (14:00)</option>
          <option value="12">12-hour (2:00 PM)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Time zone</span>
        <select id="settings-tz" defaultValue="rome" className={field}>
          <option value="rome">Europe/Rome (CET)</option>
          <option value="london">Europe/London (GMT)</option>
        </select>
      </label>
      <PrototypeNote />
    </div>
  );
}

function CalendarSection() {
  const toast = usePlanStore((s) => s.toast);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Show your confirmed timetable in the calendar app you already use.</p>
      {['Google Calendar', 'Outlook', 'Apple Calendar'].map((app) => (
        <div key={app} className="flex items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-slate-900">{app}</span>
          <button onClick={() => toast(`Connecting ${app} is not available in this prototype.`)} className="text-sm font-medium text-blue-600 hover:underline">
            Connect
          </button>
        </div>
      ))}
      <PrototypeNote />
    </div>
  );
}

function PrivacySection() {
  const toast = usePlanStore((s) => s.toast);
  return (
    <div className="space-y-4">
      <div>
        <Switch id="p-advisor" label="Share my plan with my advisor" description="Needed for plan approval." defaultChecked />
        <Switch id="p-analytics" label="Help improve UniTranslate" description="Share anonymous usage statistics." />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toast('Your data export would be emailed to you. Not available in this prototype.')}
          className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Download className="w-4 h-4" aria-hidden /> Download my data
        </button>
        <button disabled className="inline-flex items-center gap-1.5 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-lg opacity-60 cursor-not-allowed">
          <Trash2 className="w-4 h-4" aria-hidden /> Delete account
        </button>
      </div>
      <p className="text-xs text-slate-600">In this prototype everything is stored in your browser only. Delete account will be available in the real service.</p>
    </div>
  );
}

function RequestsSection() {
  const reports = usePlanStore((s) => s.reports);
  const email = usePlanStore((s) => s.session?.email);
  const openPanel = usePlanStore((s) => s.openPanel);
  const mine = reports.filter((r) => r.from === email);
  return (
    <div className="space-y-3">
      {mine.length ? (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {[...mine].reverse().map((r) => (
            <li key={r.id} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-500">{r.id}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {r.status === 'resolved' ? 'Resolved' : 'Open'}
                </span>
              </div>
              <p className="text-slate-900 mt-1">{r.summary}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">You haven’t sent any messages or bug reports yet.</p>
      )}
      <button onClick={() => openPanel('help', 'bug')} className="text-sm font-medium text-blue-600 hover:underline">
        Report a bug
      </button>
    </div>
  );
}

const BODIES = {
  account: AccountSection,
  notifications: NotificationsSection,
  language: LanguageSection,
  calendar: CalendarSection,
  privacy: PrivacySection,
  requests: RequestsSection,
};

/** General settings. Most sections are placeholders that show what the real service will offer. */
export function SettingsPanel() {
  const panel = usePlanStore((s) => s.panel);
  const section = usePlanStore((s) => s.settingsSection);
  const openPanel = usePlanStore((s) => s.openPanel);
  const closePanel = usePlanStore((s) => s.closePanel);
  if (panel !== 'settings') return null;
  const current = BODIES[section] ? section : 'account';
  const Body = BODIES[current];

  return (
    <Modal title="Settings" onClose={closePanel} wide>
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Settings</h2>
        <button onClick={closePanel} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Close settings">
          <X className="w-5 h-5 text-slate-600" aria-hidden />
        </button>
      </div>
      <div className="grid md:grid-cols-[14rem_1fr] min-h-[24rem]">
        <nav aria-label="Settings sections" className="border-b md:border-b-0 md:border-r border-slate-200 p-2 flex md:flex-col gap-1 overflow-x-auto">
          {SECTIONS.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => openPanel('settings', id)}
              aria-current={current === id ? 'page' : undefined}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left ${
                current === id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden /> {label}
            </button>
          ))}
          <button onClick={() => openPanel('display')} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left text-slate-700 hover:bg-slate-100">
            <Accessibility className="w-4 h-4" aria-hidden /> Display & accessibility
          </button>
        </nav>
        <section className="p-5" aria-label={SECTIONS.find(([id]) => id === current)[1]}>
          <h3 className="text-base font-semibold text-slate-900 mb-3">{SECTIONS.find(([id]) => id === current)[1]}</h3>
          <Body />
        </section>
      </div>
    </Modal>
  );
}
