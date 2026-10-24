import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Info } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { usePlanSummary } from '../../store/derived.js';
import { STUDENT, DEGREE_REQUIREMENTS } from '../../brain/student.js';
import { CAREERS } from '../../brain/skillGraph.js';
import { RichText } from '../ui/primitives.jsx';
import { ChatCourseCard } from './ChatCourseCard.jsx';

export const QUICK_PROMPTS = [
  'What electives fit my timetable for a career in FinTech?',
  'Explain the syllabus difference between Data Mining and Machine Learning.',
  'Find non-conflicting courses to complete my remaining 6 CFUs.',
];

const MODES = [
  ['planner', 'Study Planner'],
  ['concept', 'Course Concept Tutor'],
];

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function BotAvatar() {
  return (
    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shrink-0">
      <Bot className="w-4 h-4 text-white" aria-hidden />
    </div>
  );
}

/** Live view of what the tutor "knows" from the H-OS Brain. */
function ContextCard() {
  const { planCourses, total, conflicts } = usePlanSummary();
  const done = Object.values(STUDENT.completedCfu).reduce((s, v) => s + v, 0);
  const goals = STUDENT.careerGoals.map((id) => CAREERS.find((c) => c.id === id)?.label).join(', ');
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-blue-800">
        <Info className="w-4 h-4" aria-hidden /> H-OS Brain context (live)
      </p>
      <ul className="text-xs text-blue-700 space-y-0.5">
        <li>
          • Progress: {done}/{DEGREE_REQUIREMENTS.totalCfu} CFU ({((done / DEGREE_REQUIREMENTS.totalCfu) * 100).toFixed(1)}%)
        </li>
        <li>• Track: {STUDENT.track} · Goals: {goals}</li>
        <li>
          • Draft: {planCourses.length} courses ({total} CFU of {STUDENT.semesterTargetCfu} target)
        </li>
        <li className={conflicts.length ? 'text-red-700 font-semibold' : ''}>• Timetable overlaps: {conflicts.length}</li>
      </ul>
    </div>
  );
}

export function AdvisorChatbot({ onClose }) {
  const messages = usePlanStore((s) => s.messages);
  const typing = usePlanStore((s) => s.typing);
  const tutorMode = usePlanStore((s) => s.tutorMode);
  const setTutorMode = usePlanStore((s) => s.setTutorMode);
  const sendChat = usePlanStore((s) => s.sendChat);
  const addMany = usePlanStore((s) => s.addMany);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const submit = (e) => {
    e.preventDefault();
    sendChat(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white" data-tour={onClose ? undefined : 'tutor'}>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">StudyPlus AI Tutor</h3>
            <p className="text-xs text-purple-200">Academic Advisor & Tutor · Powered by H-OS Brain</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-xs bg-green-700 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Online
          </span>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg" aria-label="Close AI tutor">
              <X className="w-5 h-5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">Mode</span>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Tutor mode">
          {MODES.map(([id, label]) => (
            <button
              key={id}
              role="radio"
              aria-checked={tutorMode === id}
              onClick={() => setTutorMode(id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                tutorMode === id ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4" aria-live="polite">
        <div className="flex gap-3">
          <BotAvatar />
          <div className="flex-1 min-w-0">
            <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-700">
              Hi {STUDENT.name}! I'm your AI Academic Advisor. I can see your full record on the {STUDENT.track} track, your live draft and every
              timetable in the catalogue. How can I help?
            </div>
          </div>
        </div>
        <ContextCard />

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] text-right">
                <div className="bg-purple-600 text-white rounded-lg px-3 py-2 text-sm inline-block text-left">{m.text}</div>
                <p className="text-[11px] text-slate-400 mt-1">{time(m.at)}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-3 view-enter">
              <BotAvatar />
              <div className="flex-1 min-w-0">
                <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-700 space-y-0.5">
                  <RichText text={m.text} />
                  {m.cards?.map((code) => (
                    <ChatCourseCard key={code} code={code} />
                  ))}
                  {m.bulkAdd && (
                    <button
                      onClick={() => addMany(m.bulkAdd)}
                      className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded-lg"
                    >
                      ⚡ Add all {m.bulkAdd.length} to Draft
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{time(m.at)}</p>
              </div>
            </div>
          ),
        )}

        {typing && (
          <div className="flex gap-3">
            <BotAvatar />
            <div className="bg-slate-100 rounded-lg p-3 flex gap-1" aria-label="AI tutor is typing">
              {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot inline-block w-2 h-2 bg-slate-400 rounded-full" />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3 bg-slate-50">
        <p className="text-xs font-medium text-slate-600 mb-2" data-tour={onClose ? undefined : 'quick-prompts'}>Quick prompts</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendChat(p)}
              disabled={typing}
              className="text-xs text-left bg-white border border-slate-300 hover:border-purple-500 hover:text-purple-700 disabled:opacity-50 px-3 py-1.5 rounded-full transition-colors"
            >
              💬 {p}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="border-t border-slate-200 p-3 bg-white flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Message the AI tutor</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tutorMode === 'concept' ? 'Ask about a syllabus topic…' : 'Ask about courses, conflicts, careers…'}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>
        <button type="submit" disabled={!input.trim() || typing} className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white p-2 rounded-lg" aria-label="Send message">
          <Send className="w-5 h-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}

/** Floating bottom-right launcher + slide-in drawer (hidden while the dedicated tab is open). */
export function ChatDrawer() {
  const chatOpen = usePlanStore((s) => s.chatOpen);
  const closeChat = usePlanStore((s) => s.closeChat);
  const openChat = usePlanStore((s) => s.openChat);
  const activeTab = usePlanStore((s) => s.activeTab);
  if (activeTab === 'advisor') return null;

  return (
    <>
      {!chatOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-5 right-5 w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl z-40 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-300"
          aria-label="Open StudyPlus AI Tutor"
        >
          <Bot className="w-7 h-7 text-white" aria-hidden />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}
      {chatOpen && <div className="fixed inset-0 bg-ink-900/40 z-40 sm:hidden" onClick={closeChat} aria-hidden />}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:max-w-md shadow-2xl z-50 transition-transform duration-300 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!chatOpen}
        inert={!chatOpen}
      >
        <AdvisorChatbot onClose={closeChat} />
      </div>
    </>
  );
}
