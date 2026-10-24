/**
 * Shared planning logic used by the proactive agents, the tutor and the UI.
 */
import { SKILL_BY_ID, CAREERS } from '../brain/skillGraph.js';
import { conflictsWith } from '../librarian/schedule.js';

export function skillLabel(id) {
  return SKILL_BY_ID[id]?.label ?? id;
}

/** @returns {{ id, label, status: 'met'|'concurrent'|'missing' }[]} */
export function prerequisiteStatus(course, student, planCourses = []) {
  const plannedSkills = new Set(planCourses.filter((c) => c.code !== course.code).map((c) => c.provides));
  return course.prerequisites.map((id) => ({
    id,
    label: skillLabel(id),
    cfu: SKILL_BY_ID[id]?.cfu ?? 6,
    status: student.completedSkills.includes(id) ? 'met' : plannedSkills.has(id) ? 'concurrent' : 'missing',
  }));
}

export function prerequisitesMet(course, student) {
  return course.prerequisites.every((id) => student.completedSkills.includes(id));
}

export function planTotals(planCourses) {
  const byBucket = { core: 0, electives: 0, thesis: 0 };
  let total = 0;
  for (const c of planCourses) {
    byBucket[c.bucket] = (byBucket[c.bucket] ?? 0) + c.cfu;
    total += c.cfu;
  }
  return { total, byBucket };
}

/** All transitive prerequisites of a skill (not including the skill itself). */
export function ancestorsOf(id, seen = new Set()) {
  for (const req of SKILL_BY_ID[id]?.requires ?? []) {
    if (!seen.has(req)) {
      seen.add(req);
      ancestorsOf(req, seen);
    }
  }
  return seen;
}

/** +2 per career goal requiring the course's skill directly, +1 when it's an upstream prerequisite. */
export function careerFit(course, careerIds) {
  let score = 0;
  for (const career of CAREERS.filter((c) => careerIds.includes(c.id))) {
    if (career.requires.includes(course.provides)) score += 2;
    else if (career.requires.some((r) => ancestorsOf(r).has(course.provides))) score += 1;
  }
  return score;
}

/**
 * Courses the student could add right now: not in plan, prerequisites passed, no clash
 * with `planCourses`. Sorted by bucket match, career fit and student reviews.
 */
export function rankCandidates({ planCourses, catalog, student, preferBucket = 'electives', careerIds = student.careerGoals }) {
  const planCodes = new Set(planCourses.map((c) => c.code));
  return catalog
    .filter((c) => !planCodes.has(c.code) && c.type !== 'compulsory' && c.type !== 'thesis')
    .filter((c) => prerequisitesMet(c, student))
    .filter((c) => conflictsWith(c, planCourses).length === 0)
    .map((c) => ({
      course: c,
      score: (c.bucket === preferBucket ? 3 : 0) + careerFit(c, careerIds) * 1.5 + (c.reviewScore ?? 3) / 5,
    }))
    .sort((a, b) => b.score - a.score);
}

/** Best non-overlapping substitute for `drop`, given the rest of the plan. */
export function recommendReplacement({ drop, planCourses, catalog, student }) {
  const rest = planCourses.filter((c) => c.code !== drop.code);
  const ranked = rankCandidates({ planCourses: rest, catalog, student, preferBucket: drop.bucket })
    .filter(({ course }) => course.code !== drop.code)
    .map((r) => ({ ...r, score: r.score - Math.abs(r.course.cfu - drop.cfu) * 0.2 }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.course ?? null;
}

/** A set of mutually non-conflicting courses that covers `shortage` CFU, preferring a tight fit. */
export function findFillers({ shortage, planCourses, catalog, student, careerIds }) {
  if (shortage <= 0) return [];
  const ranked = rankCandidates({ planCourses, catalog, student, careerIds });
  const single = ranked
    .filter(({ course }) => course.cfu >= shortage)
    .sort((a, b) => a.course.cfu - shortage - (b.course.cfu - shortage) || b.score - a.score)[0];
  if (single) return [single.course];

  const picked = [];
  let total = 0;
  for (const { course } of ranked) {
    if (total >= shortage) break;
    if (conflictsWith(course, picked).length === 0) {
      picked.push(course);
      total += course.cfu;
    }
  }
  return picked;
}
