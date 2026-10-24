import { describe, it, expect } from 'vitest';
import { BRAIN_COURSES } from '../brain/courses.js';
import { INITIAL_PLAN, STUDENT } from '../brain/student.js';
import { RAW_SYLLABUS_FEED } from '../brain/rawFeed.js';
import { normalizeCourse } from '../librarian/normalize.js';
import { ingestFeed } from '../librarian/ingest.js';
import { findConflicts, sessionsOverlap } from '../librarian/schedule.js';
import { runProactiveAgents } from './proactiveAgent.js';
import { tutorRespond } from './tutorEngine.js';
import { assessChange } from './impact.js';

const catalog = BRAIN_COURSES.map((raw) => normalizeCourse(raw).course);
const byCode = Object.fromEntries(catalog.map((c) => [c.code, c]));
const swappedPlan = [...INITIAL_PLAN.filter((p) => p.code !== 'ADS-301'), { code: 'DMA-230', status: 'draft' }];

describe('Librarian', () => {
  it('normalises every Brain course without blocking issues', () => {
    BRAIN_COURSES.forEach((raw) => expect(normalizeCourse(raw).publishable).toBe(true));
  });

  it('treats touching slots as non-overlapping and partial overlaps as clashes', () => {
    expect(sessionsOverlap({ day: 'Tue', start: 10, end: 12 }, { day: 'Tue', start: 12, end: 14 })).toBe(false);
    expect(sessionsOverlap({ day: 'Tue', start: 10, end: 12 }, { day: 'Tue', start: 11, end: 13 })).toBe(true);
    expect(sessionsOverlap({ day: 'Tue', start: 9, end: 13 }, { day: 'Tue', start: 10, end: 11 })).toBe(true);
  });

  it('detects the ADS/DBS overlap in the initial draft', () => {
    const conflicts = findConflicts(INITIAL_PLAN.map((p) => byCode[p.code]));
    expect(conflicts.map(({ a, b }) => [a.code, b.code].sort())).toEqual([['ADS-301', 'DBS-210']]);
  });

  it('publishes clean feed records and quarantines ones without a timetable', () => {
    const report = ingestFeed(RAW_SYLLABUS_FEED, catalog.map((c) => c.code));
    expect(report.filter((r) => r.publishable).map((r) => r.course.code)).toEqual(['CYB-205', 'NLP-330']);
    const eth = report.find((r) => r.course.code === 'ETH-120');
    expect(eth.publishable).toBe(false);
    expect(eth.course.cfu).toBe(6);
  });
});

describe('Proactive agents', () => {
  it('raises a critical overlap alert with a swap recommendation', () => {
    const alerts = runProactiveAgents({ plan: INITIAL_PLAN, catalog, student: STUDENT });
    const critical = alerts.find((a) => a.severity === 'critical');
    expect(critical.message).toBe('"Advanced Data Science" (Tue 10:00-12:00) conflicts with compulsory "Digital Business Strategy".');
    expect(critical.actions[0]).toMatchObject({ kind: 'swap', drop: 'ADS-301', add: 'DMA-230' });
  });

  it('clears the critical alert once the swap is applied', () => {
    const alerts = runProactiveAgents({ plan: swappedPlan, catalog, student: STUDENT });
    expect(alerts.some((a) => a.severity === 'critical')).toBe(false);
    expect(alerts.find((a) => a.id === 'credits:short').message).toContain('6 CFU short');
  });

  it('warns about missing prerequisites and missing compulsory courses', () => {
    const plan = [{ code: 'ML-320', status: 'draft' }];
    const ids = runProactiveAgents({ plan, catalog, student: STUDENT }).map((a) => a.id);
    expect(ids).toContain('prereq:ML-320:linalg');
    expect(ids).toContain('compulsory:DBS-210');
  });
});

describe('AI tutor', () => {
  const ask = (msg, mode = 'planner', plan = swappedPlan) => tutorRespond(msg, { mode, catalog, plan, student: STUDENT });

  it('recommends conflict-free FinTech electives', () => {
    expect(ask('What electives fit my timetable for a career in FinTech?').cards).toEqual(['FIN-260']);
  });

  it('compares syllabi in concept mode', () => {
    const reply = ask('Explain the syllabus difference between Data Mining and Machine Learning.', 'concept');
    expect(reply.cards).toEqual(['DMN-310', 'ML-320']);
    expect(reply.text).toContain('Shared ground: Clustering');
  });

  it('fills the remaining 6 CFU with non-conflicting courses', () => {
    const reply = ask('Find non-conflicting courses to complete my remaining 6 CFUs.');
    const picked = reply.cards.map((c) => byCode[c]);
    const plan = swappedPlan.map((p) => byCode[p.code]);
    expect(picked.reduce((s, c) => s + c.cfu, 0)).toBeGreaterThanOrEqual(6);
    expect(findConflicts([...plan, ...picked])).toHaveLength(0);
  });
});

describe('Impact agent', () => {
  it('always asks before dropping and lists what the drop causes', () => {
    const { needsConfirm, effects } = assessChange({ plan: INITIAL_PLAN, catalog, student: STUDENT, change: { kind: 'remove', codes: ['DBS-210'] } });
    expect(needsConfirm).toBe(true);
    const text = effects.map((e) => e.text).join('\n');
    expect(text).toContain('confirmed enrolment');
    expect(text).toContain('mandatory this semester');
    expect(text).toContain('Resolves:');
  });

  it('asks before adding a course that clashes or lacks prerequisites', () => {
    const clash = assessChange({ plan: swappedPlan, catalog, student: STUDENT, change: { kind: 'add', codes: ['ADS-301'] } });
    expect(clash.needsConfirm).toBe(true);
    expect(clash.effects.some((e) => e.tone === 'critical')).toBe(true);
    const prereq = assessChange({ plan: swappedPlan, catalog, student: STUDENT, change: { kind: 'add', codes: ['ML-320'] } });
    expect(prereq.effects.some((e) => e.tone === 'warning' && e.text.includes('Linear Algebra'))).toBe(true);
  });

  it('adds a harmless course without asking', () => {
    const { needsConfirm } = assessChange({ plan: swappedPlan, catalog, student: STUDENT, change: { kind: 'add', codes: ['DMN-310'] } });
    expect(needsConfirm).toBe(false);
  });
});
