/**
 * Impact agent — predicts the consequences of a plan change before it is applied,
 * by running the proactive agents on the plan before and after the change.
 *
 * change: { kind: 'add' | 'remove' | 'swap', codes: string[] }   (swap: [dropCode, addCode])
 */
import { CAREERS } from '../brain/skillGraph.js';
import { runProactiveAgents } from './proactiveAgent.js';
import { planTotals } from './planning.js';

export function applyPlanChange(plan, { kind, codes }) {
  if (kind === 'remove') return plan.filter((p) => !codes.includes(p.code));
  if (kind === 'swap') {
    const [drop, add] = codes;
    return [...plan.filter((p) => p.code !== drop && p.code !== add), { code: add, status: 'draft' }];
  }
  const fresh = codes.filter((code) => !plan.some((p) => p.code === code));
  return [...plan, ...fresh.map((code) => ({ code, status: 'draft' }))];
}

const isIssue = (a) => a.severity === 'critical' || a.severity === 'warning';

/**
 * @returns {{ after: object[], effects: { tone: 'critical'|'warning'|'positive'|'info', text: string }[], needsConfirm: boolean }}
 */
export function assessChange({ plan, catalog, student, change }) {
  const byCode = Object.fromEntries(catalog.map((c) => [c.code, c]));
  const after = applyPlanChange(plan, change);
  const coursesOf = (p) => p.map((e) => byCode[e.code]).filter(Boolean);

  const beforeAlerts = runProactiveAgents({ plan, catalog, student }).filter(isIssue);
  const afterAlerts = runProactiveAgents({ plan: after, catalog, student }).filter(isIssue);
  const beforeIds = new Set(beforeAlerts.map((a) => a.id));
  const afterIds = new Set(afterAlerts.map((a) => a.id));
  // The credit alert keeps its id while its numbers change, so compare it separately below.
  const created = afterAlerts.filter((a) => !beforeIds.has(a.id));
  const resolved = beforeAlerts.filter((a) => !afterIds.has(a.id));

  const effects = [];
  const totalBefore = planTotals(coursesOf(plan)).total;
  const totalAfter = planTotals(coursesOf(after)).total;
  if (totalBefore !== totalAfter) {
    effects.push({ tone: 'info', text: `Semester load changes from ${totalBefore} CFU to ${totalAfter} CFU (target ${student.semesterTargetCfu} CFU).` });
  }

  if (change.kind === 'remove' || change.kind === 'swap') {
    const removed = change.kind === 'remove' ? change.codes : [change.codes[0]];
    for (const code of removed) {
      const entry = plan.find((p) => p.code === code);
      const course = byCode[code];
      if (!entry || !course) continue;
      if (entry.status === 'confirmed') {
        effects.push({
          tone: 'warning',
          text: `"${course.title}" is a confirmed enrolment. Dropping it releases your seat, and re-enrolling needs Prof. Rossi's approval.`,
        });
      }
      const careers = CAREERS.filter((c) => student.careerGoals.includes(c.id) && c.requires.includes(course.provides));
      if (careers.length) {
        effects.push({ tone: 'warning', text: `You lose a key skill for your goal: ${careers.map((c) => `🎯 ${c.label}`).join(', ')}.` });
      }
    }
  }

  for (const a of created) effects.push({ tone: a.severity, text: a.message });
  for (const a of resolved) effects.push({ tone: 'positive', text: `Resolves: ${a.message}` });

  const needsConfirm = change.kind === 'remove' || effects.some((e) => e.tone === 'critical' || e.tone === 'warning');
  return { after, effects, needsConfirm };
}
