import { useState } from 'react';
import { X, Bug, LifeBuoy, CircleHelp, Mail, Phone, MessageCircle, Copy, Check, Clock, MapPin, Paperclip } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { useActiveTab, ROLE_TABS } from '../layout/TabNav.jsx';
import { Modal } from '../ui/primitives.jsx';

const SECTIONS = [
  ['contact', 'Contact us', LifeBuoy],
  ['bug', 'Report a bug', Bug],
  ['faq', 'FAQ', CircleHelp],
];

const CONTACTS = [
  { Icon: Mail, label: 'Student office', value: 'students@unitranslate.example', copy: true },
  { Icon: Mail, label: 'Technical support', value: 'support@unitranslate.example', copy: true },
  { Icon: Phone, label: 'Phone', value: '+39 041 000 0000', copy: true },
  { Icon: Clock, label: 'Office hours', value: 'Monday–Friday, 09:00–13:00 and 14:00–16:00' },
  { Icon: MapPin, label: 'Help desk', value: "Ca' Foscari Main Campus, Building A, ground floor" },
];

const FAQ = [
  ['How do I fix a timetable clash?', 'Open Explore courses or My week. The red alert explains the clash and offers a one-tap fix that swaps in a course with no overlap.'],
  ['Why can’t I submit my plan?', 'Plans with a timetable overlap can’t be submitted. Resolve the red alert first, then use Submit plan on your Home page.'],
  ['Who approves my plan?', 'Your academic advisor. You’ll see their decision and any feedback on your Home page.'],
  ['I haven’t chosen a programme yet. Where do I start?', 'Sign in as a future student. Pick a career you like and UniTranslate shows every programme that leads there.'],
  ['Is my data shared?', 'In this prototype nothing leaves your device. Your plan and settings are stored in your browser only.'],
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; select the text so it can be copied by hand.
      const range = document.createRange();
      range.selectNodeContents(e.currentTarget.previousSibling);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  };
  return (
    <button onClick={copy} className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100" aria-label={`Copy ${text}`}>
      {copied ? <Check className="w-4 h-4 text-green-700" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
    </button>
  );
}

function ContactSection({ onSwitch }) {
  const role = usePlanStore((s) => s.role);
  const session = usePlanStore((s) => s.session);
  const submitReport = usePlanStore((s) => s.submitReport);
  const toast = usePlanStore((s) => s.toast);
  const [message, setMessage] = useState('');
  const [sentId, setSentId] = useState(null);

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
        {CONTACTS.map(({ Icon, label, value, copy }) => (
          <li key={label} className="flex items-start gap-3 px-4 py-3">
            <Icon className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="flex items-center gap-1 text-sm text-slate-900">
                <span className="select-all break-all">{value}</span>
                {copy && <CopyButton text={value} />}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => toast('Live chat opens here in the real service. In this prototype, send a message below.')}
          className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-sm font-medium py-2 rounded-lg"
        >
          <MessageCircle className="w-4 h-4" aria-hidden /> Chat with support
        </button>
        <button onClick={() => onSwitch('bug')} className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-sm font-medium py-2 rounded-lg">
          <Bug className="w-4 h-4" aria-hidden /> Report a bug instead
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim()) return;
          setSentId(submitReport({ type: 'message', summary: message.trim().slice(0, 80), details: message.trim() }));
          setMessage('');
        }}
        className="space-y-2"
      >
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">Send us a message</span>
          <span className="block text-xs text-slate-600">
            {role === 'student' ? 'Questions about your plan go to the student office; your advisor is copied.' : 'We reply within two working days.'}
          </span>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="How can we help?"
          />
        </label>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">Reply to: {session?.email ?? 'add your email in the message'}</span>
          <button type="submit" disabled={!message.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Send message
          </button>
        </div>
        {sentId && (
          <p className="text-sm text-green-800 bg-green-50 rounded-lg px-3 py-2" role="status">
            Message sent. Your reference is <strong>{sentId}</strong>.
          </p>
        )}
      </form>
    </div>
  );
}

function BugSection() {
  const session = usePlanStore((s) => s.session);
  const role = usePlanStore((s) => s.role);
  const submitReport = usePlanStore((s) => s.submitReport);
  const activeTab = useActiveTab();
  const views = session ? ROLE_TABS[role] : [];
  const here = views.find((t) => t.id === activeTab)?.label ?? 'Sign-in page';

  const [form, setForm] = useState({ kind: 'bug', where: here, what: '', expected: '', severity: 'annoying', email: session?.email ?? '', details: true });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [sentId, setSentId] = useState(null);
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const technical = `${navigator.userAgent.split(') ')[0]})` + ` · screen ${window.innerWidth}×${window.innerHeight} · view: ${form.where}`;

  if (sentId) {
    return (
      <div className="text-center py-8 space-y-3" role="status">
        <p className="text-4xl" aria-hidden>
          ✅
        </p>
        <h3 className="text-lg font-bold text-slate-900">Thanks, we got it</h3>
        <p className="text-sm text-slate-600">
          Your report <strong>{sentId}</strong> was sent to the department team. {form.email ? `We'll follow up at ${form.email}.` : ''}
        </p>
        <button onClick={() => setSentId(null)} className="text-sm font-medium text-blue-600 hover:underline">
          Report another problem
        </button>
      </div>
    );
  }

  const field = 'mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.what.trim()) return setError('Please describe what happened.');
        setError('');
        setSentId(
          submitReport({
            type: form.kind,
            summary: form.what.trim().slice(0, 80),
            details: form.what.trim(),
            expected: form.expected.trim(),
            where: form.where,
            severity: form.severity,
            contact: form.email,
            attachment: file?.name ?? null,
            technical: form.details ? technical : null,
          }),
        );
      }}
      className="space-y-3"
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Type</span>
          <select id="bug-kind" value={form.kind} onChange={update('kind')} className={field}>
            <option value="bug">Something is broken</option>
            <option value="confusing">Something is confusing</option>
            <option value="accessibility">Accessibility problem</option>
            <option value="idea">Idea or suggestion</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Where did it happen?</span>
          <select id="bug-where" value={form.where} onChange={update('where')} className={field}>
            {[here, ...views.map((v) => v.label).filter((l) => l !== here), 'Sign-in page', 'Settings', 'Somewhere else'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">What happened?</span>
        <textarea id="bug-what" value={form.what} onChange={update('what')} rows={3} className={field} placeholder="e.g. I tapped Add to draft and nothing changed" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          What did you expect? <span className="font-normal text-slate-500">(optional)</span>
        </span>
        <textarea id="bug-expected" value={form.expected} onChange={update('expected')} rows={2} className={field} />
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">How much does it affect you?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {[
            ['blocking', 'It stops me'],
            ['annoying', 'It slows me down'],
            ['minor', 'Minor'],
          ].map(([id, label]) => (
            <label key={id} className="cursor-pointer">
              <input type="radio" name="severity" value={id} checked={form.severity === id} onChange={update('severity')} className="peer sr-only" />
              <span className="inline-block px-3 py-1.5 rounded-full border border-slate-300 text-sm peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Screenshot <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <span className="mt-1 flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600">
            <Paperclip className="w-4 h-4 shrink-0" aria-hidden />
            <input id="bug-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs w-full" />
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email for follow-up</span>
          <input id="bug-email" type="email" value={form.email} onChange={update('email')} className={field} placeholder="you@example.com" />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.details} onChange={update('details')} className="mt-0.5 accent-blue-600" />
        <span>
          Include technical details
          <span className="block text-xs text-slate-500 break-all">{technical}</span>
        </span>
      </label>
      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Send report
        </button>
      </div>
    </form>
  );
}

function FaqSection() {
  return (
    <div className="space-y-2">
      {FAQ.map(([q, a]) => (
        <details key={q} className="group border border-slate-200 rounded-xl px-4 py-3">
          <summary className="cursor-pointer font-medium text-slate-900 list-none flex justify-between gap-2">
            {q}
            <span className="text-slate-400 group-open:rotate-90 transition-transform" aria-hidden>
              ›
            </span>
          </summary>
          <p className="mt-2 text-sm text-slate-600">{a}</p>
        </details>
      ))}
    </div>
  );
}

/** Help & feedback: contact details, a bug-report form and FAQ. Works signed in or out. */
export function HelpCenter() {
  const panel = usePlanStore((s) => s.panel);
  const section = usePlanStore((s) => s.settingsSection);
  const openPanel = usePlanStore((s) => s.openPanel);
  const closePanel = usePlanStore((s) => s.closePanel);
  if (panel !== 'help') return null;
  const current = SECTIONS.some(([id]) => id === section) ? section : 'contact';

  return (
    <Modal title="Help and feedback" onClose={closePanel}>
      <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Help & feedback</h2>
          <p className="text-sm text-slate-600">Get in touch, or tell us what isn’t working.</p>
        </div>
        <button onClick={closePanel} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Close help">
          <X className="w-5 h-5 text-slate-600" aria-hidden />
        </button>
      </div>
      <div className="px-5 pt-4">
        <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-1" role="tablist" aria-label="Help sections">
          {SECTIONS.map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={current === id}
              onClick={() => openPanel('help', id)}
              className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium ${
                current === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        {current === 'contact' && <ContactSection onSwitch={(id) => openPanel('help', id)} />}
        {current === 'bug' && <BugSection />}
        {current === 'faq' && <FaqSection />}
      </div>
    </Modal>
  );
}
