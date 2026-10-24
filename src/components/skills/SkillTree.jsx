import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleAlert, Lock, LockOpen, Target, BookOpen } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { usePlanCourses } from '../../store/derived.js';
import { SKILL_NODES, SKILL_BY_ID, CAREERS } from '../../brain/skillGraph.js';
import { STUDENT } from '../../brain/student.js';
import { ancestorsOf, prerequisitesMet } from '../../agents/planning.js';
import { conflictsWith } from '../../librarian/schedule.js';

const MIN_W = 1000;
const NODE_W = 132;
const NODE_H = 92;
const CAREER_W = 220;
const CAREER_H = 96;
const TIER_Y = { 1: 36, 2: 214, 3: 392, 4: 570 };
const H = TIER_Y[4] + CAREER_H + 24;

const TIER_TITLES = {
  1: 'Tier 1 · Foundation Prerequisites',
  2: 'Tier 2 · This Semester',
  3: 'Tier 3 · Unlocked Advanced Subjects',
  4: 'Tier 4 · Target Career Outcomes',
};

const STATUS_STYLE = {
  completed: { box: 'bg-green-50 border-green-500', text: 'text-green-800', Icon: CircleCheck, label: 'Completed' },
  planned: { box: 'bg-blue-50 border-blue-500', text: 'text-blue-800', Icon: Target, label: 'In your plan' },
  available: { box: 'bg-purple-50 border-purple-400', text: 'text-purple-800', Icon: LockOpen, label: 'Available now' },
  missing: { box: 'bg-amber-50 border-amber-500', text: 'text-amber-800', Icon: CircleAlert, label: 'Missing' },
  locked: { box: 'bg-slate-50 border-slate-300', text: 'text-slate-600', Icon: Lock, label: 'Locked' },
  next: { box: 'bg-indigo-50 border-indigo-300', text: 'text-indigo-800', Icon: LockOpen, label: 'Unlocks next semester' },
};

function rowPositions(items, width, W) {
  return items.map((item, i) => ({ ...item, x: (W / items.length) * (i + 0.5) - width / 2 }));
}

/** Canvas width follows the container so the graph fits without clipping (scrolls below MIN_W). */
function useCanvasWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(MIN_W);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(MIN_W, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export function SkillTree() {
  const planCourses = usePlanCourses();
  const catalog = usePlanStore((s) => s.catalog);
  const addMany = usePlanStore((s) => s.addMany);
  const askTutor = usePlanStore((s) => s.askTutor);
  const [selected, setSelected] = useState('ai-data-analyst');
  const [canvasRef, W] = useCanvasWidth();

  const { nodes, careers, positions } = useMemo(() => {
    const plannedSkills = new Set(planCourses.map((c) => c.provides));
    const done = (id) => STUDENT.completedSkills.includes(id);
    const statusOf = (n) => {
      if (done(n.id)) return 'completed';
      if (plannedSkills.has(n.id)) return 'planned';
      const reqsDone = n.requires.every(done);
      const reqsReady = n.requires.every((r) => done(r) || plannedSkills.has(r));
      if (n.code) return reqsDone ? (n.tier === 1 ? 'missing' : 'available') : 'locked';
      return reqsReady ? 'next' : 'locked';
    };
    const nodes = [1, 2, 3].flatMap((tier) =>
      rowPositions(
        SKILL_NODES.filter((n) => n.tier === tier).map((n) => ({ ...n, status: statusOf(n), y: TIER_Y[tier] })),
        NODE_W,
        W,
      ),
    );
    const careers = rowPositions(
      CAREERS.map((c) => ({
        ...c,
        y: TIER_Y[4],
        progress: c.requires.filter((r) => done(r) || plannedSkills.has(r)).length,
      })),
      CAREER_W,
      W,
    );
    const positions = Object.fromEntries([
      ...nodes.map((n) => [n.id, { cx: n.x + NODE_W / 2, top: n.y, bottom: n.y + NODE_H }]),
      ...careers.map((c) => [c.id, { cx: c.x + CAREER_W / 2, top: c.y, bottom: c.y + CAREER_H }]),
    ]);
    return { nodes, careers, positions };
  }, [planCourses, W]);

  // The exact upstream learning path for the selected node or career.
  const path = useMemo(() => {
    if (!selected) return new Set();
    const career = CAREERS.find((c) => c.id === selected);
    const set = new Set([selected]);
    for (const id of career ? career.requires : [selected]) {
      set.add(id);
      ancestorsOf(id).forEach((a) => set.add(a));
    }
    return set;
  }, [selected]);

  const edges = [
    ...nodes.flatMap((n) => n.requires.map((r) => ({ from: r, to: n.id }))),
    ...careers.flatMap((c) => c.requires.map((r) => ({ from: r, to: c.id }))),
  ];

  const pathNodes = nodes.filter((n) => path.has(n.id) && n.id !== selected).sort((a, b) => a.tier - b.tier);
  const selectedNode = nodes.find((n) => n.id === selected);
  const selectedCareer = careers.find((c) => c.id === selected);
  const actionable = [...pathNodes, ...(selectedNode ? [selectedNode] : [])]
    .map((n) => catalog.find((c) => c.provides === n.id))
    .filter(
      (c) =>
        c &&
        !planCourses.some((p) => p.code === c.code) &&
        !STUDENT.completedSkills.includes(c.provides) &&
        prerequisitesMet(c, STUDENT) &&
        conflictsWith(c, planCourses).length === 0,
    );

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Skill Tree & Career Pathways</h2>
          <p className="text-sm text-slate-600">Click any course or career to highlight the exact prerequisite path leading to it.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(STATUS_STYLE).map(([id, s]) => (
            <span key={id} className={`px-2 py-0.5 rounded-full border ${s.box} ${s.text}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin p-4 space-y-4">
        <div ref={canvasRef} className="overflow-x-auto scrollbar-thin bg-white border border-slate-200 rounded-xl">
          <div className="relative mx-auto" style={{ width: W, height: H }}>
            {[1, 2, 3, 4].map((t) => (
              <p key={t} className="absolute left-3 z-10 bg-white/90 px-1 rounded text-[11px] font-semibold uppercase tracking-wide text-slate-400" style={{ top: TIER_Y[t] - 24 }}>
                {TIER_TITLES[t]}
              </p>
            ))}
            <svg className="absolute inset-0 pointer-events-none" width={W} height={H} aria-hidden>
              {edges.map(({ from, to }) => {
                const a = positions[from];
                const b = positions[to];
                if (!a || !b) return null;
                const on = path.has(from) && path.has(to);
                const midY = (a.bottom + b.top) / 2;
                return (
                  <path
                    key={`${from}-${to}`}
                    d={`M ${a.cx} ${a.bottom} C ${a.cx} ${midY}, ${b.cx} ${midY}, ${b.cx} ${b.top}`}
                    fill="none"
                    stroke={on ? '#f59e0b' : '#cbd5e1'}
                    strokeWidth={on ? 3 : 1.5}
                    opacity={selected && !on ? 0.45 : 1}
                  />
                );
              })}
            </svg>

            {nodes.map((n) => {
              const st = STATUS_STYLE[n.status];
              const on = path.has(n.id);
              const { Icon } = st;
              return (
                <button
                  key={n.id}
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                  aria-pressed={selected === n.id}
                  className={`absolute text-left rounded-xl border-2 p-2.5 overflow-hidden transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 ${st.box} ${
                    on ? 'shadow-[0_0_0_3px_#fbbf24,0_0_18px_rgba(251,191,36,0.5)]' : selected ? 'opacity-60' : ''
                  }`}
                  style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                >
                  <span className={`flex items-start gap-1.5 text-xs font-semibold leading-tight ${st.text}`}>
                    <Icon className="w-4 h-4 shrink-0" aria-hidden />
                    {n.label}
                  </span>
                  <span className={`block text-[11px] mt-1 ${st.text} opacity-80`}>
                    {n.cfu} CFU · {n.status === 'locked' && n.requires.length ? `After ${n.requires.map((r) => SKILL_BY_ID[r].label).join(', ')}` : st.label}
                  </span>
                </button>
              );
            })}

            {careers.map((c) => {
              const on = selected === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(on ? null : c.id)}
                  aria-pressed={on}
                  className={`absolute text-left rounded-xl p-3 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    on ? 'ring-4 ring-amber-400' : selected ? 'opacity-70' : ''
                  }`}
                  style={{ left: c.x, top: c.y, width: CAREER_W, height: CAREER_H }}
                >
                  <span className="flex items-center gap-1.5 font-bold text-sm">🎯 {c.label}</span>
                  <span className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.demand.startsWith('High') ? 'bg-green-500' : 'bg-amber-500'}`}>{c.demand}</span>
                    <span className="text-xs text-slate-300">{c.salary}</span>
                  </span>
                  <span className="block mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <span className="block h-full bg-amber-400" style={{ width: `${(c.progress / c.requires.length) * 100}%` }} />
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {c.progress}/{c.requires.length} key skills completed or planned
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <section className="bg-white border border-slate-200 rounded-xl p-4" aria-live="polite">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" aria-hidden />
              Learning path to {selectedCareer ? `🎯 ${selectedCareer.label}` : selectedNode?.label}
            </h3>
            <ol className="mt-3 flex flex-wrap gap-2">
              {pathNodes.map((n) => (
                <li key={n.id} className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLE[n.status].box} ${STATUS_STYLE[n.status].text}`}>
                  T{n.tier} · {n.label} — {STATUS_STYLE[n.status].label}
                </li>
              ))}
              {!pathNodes.length && <li className="text-xs text-slate-500">No prerequisites — this is a foundation course.</li>}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => addMany(actionable.map((c) => c.code))}
                disabled={!actionable.length}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 rounded-lg"
              >
                {actionable.length ? `+ Add ${actionable.length} conflict-free path course(s) to draft` : 'Nothing on this path to add this semester'}
              </button>
              {selectedCareer && (
                <button
                  onClick={() => askTutor(`What electives fit my timetable for a career as ${selectedCareer.label}?`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-2 rounded-lg"
                >
                  🤖 Ask AI Tutor about this career
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
