/**
 * StudyPlus AI Tutor — rule-based reasoning over the H-OS Brain.
 *
 * Every answer is computed from live state (catalogue, draft plan, student record),
 * so recommendations always reflect the current timetable. Responses are structured
 * data — text plus course codes to render as actionable mini cards — never raw HTML.
 *
 * @typedef {{ text: string, cards?: string[], bulkAdd?: string[] }} TutorReply
 */
import { CAREERS } from '../brain/skillGraph.js';
import { DEGREE_REQUIREMENTS } from '../brain/student.js';
import { findConflicts, formatSchedule, conflictsWith } from '../librarian/schedule.js';
import {
  careerFit,
  findFillers,
  planTotals,
  prerequisiteStatus,
  rankCandidates,
  recommendReplacement,
  skillLabel,
} from './planning.js';

const CONCEPT_GLOSSARY = [
  {
    terms: ['gradient descent'],
    text: '**Gradient descent** is how most models learn: compute how the error changes with each parameter (the gradient), then take a small step in the opposite direction. Repeat until the error stops shrinking. The step size is the *learning rate* — too big and you overshoot, too small and training crawls.',
    course: 'ML-320',
  },
  {
    terms: ['eigenvalue', 'eigenvector'],
    text: 'An **eigenvector** of a matrix is a direction the matrix only stretches, never rotates; the **eigenvalue** is the stretch factor. In data science they power PCA: the top eigenvectors of the covariance matrix are the directions where your data varies most.',
    course: 'MAT-110',
  },
  {
    terms: ['overfitting', 'bias variance', 'bias-variance'],
    text: '**Overfitting** is when a model memorises training noise instead of the underlying pattern. The **bias–variance trade-off** frames it: simple models underfit (high bias), very flexible ones overfit (high variance). Cross-validation and regularisation help find the sweet spot.',
    course: 'ML-320',
  },
  {
    terms: ['clustering', 'k-means', 'kmeans'],
    text: '**Clustering** groups similar records without labels. K-means, for example, places k centroids, assigns each point to its nearest centroid, moves centroids to the mean of their points and repeats. It is covered from a pattern-discovery angle in Data Mining and from an algorithmic angle in Machine Learning.',
    course: 'DMN-310',
  },
  {
    terms: ['hypothesis test', 'p-value', 'p value'],
    text: 'A **hypothesis test** asks: if nothing interesting were going on (the null hypothesis), how surprising is my data? The **p-value** is that surprise level — a small p-value (e.g. < 0.05) suggests the effect is unlikely to be pure chance.',
    course: 'ADS-301',
  },
  {
    terms: ['smart contract'],
    text: 'A **smart contract** is code stored on a blockchain that executes automatically when its conditions are met — e.g. releasing a payment when a delivery is confirmed — without a trusted intermediary.',
    course: 'BCT-240',
  },
  {
    terms: ['attribution'],
    text: '**Attribution modelling** decides which marketing touchpoints get credit for a conversion — last click, first click, linear, or data-driven models that weigh each step of the customer journey.',
    course: 'DMA-230',
  },
  {
    terms: ['open banking', 'psd2'],
    text: '**Open banking** (driven in the EU by PSD2) lets customers share their bank data with licensed third parties via APIs, enabling account aggregation, instant payments and new FinTech products.',
    course: 'FIN-260',
  },
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordMatch = (text, term) => new RegExp(`(^|[^a-z0-9])${escapeRe(term)}([^a-z0-9]|$)`, 'i').exec(text);

/** Courses mentioned in the message, in order of first mention. */
export function matchCourses(message, catalog) {
  const lower = message.toLowerCase();
  return catalog
    .map((course) => {
      const terms = [course.title, course.code, ...(course.aliases ?? [])].map((t) => t.toLowerCase());
      const positions = terms.map((t) => wordMatch(lower, t)?.index).filter((i) => i !== undefined);
      return { course, index: positions.length ? Math.min(...positions) : -1 };
    })
    .filter((m) => m.index >= 0)
    .sort((a, b) => a.index - b.index)
    .map((m) => m.course);
}

export function matchCareer(message) {
  const lower = message.toLowerCase();
  return CAREERS.find((c) => [c.label.toLowerCase(), ...c.keywords].some((k) => wordMatch(lower, k))) ?? null;
}

function list(items) {
  return items.map((i) => `• ${i}`).join('\n');
}

function careerReply(career, ctx) {
  const { planCourses, catalog, student } = ctx;
  const planSkills = new Set(planCourses.map((c) => c.provides));
  const lines = career.requires.map((id) => {
    if (student.completedSkills.includes(id)) return `✅ ${skillLabel(id)} — completed`;
    if (planSkills.has(id)) return `📘 ${skillLabel(id)} — in your draft`;
    const offered = catalog.find((c) => c.provides === id);
    return offered ? `➕ ${skillLabel(id)} — offered this semester (${offered.code})` : `🔒 ${skillLabel(id)} — unlocks in a later semester`;
  });

  const fits = rankCandidates({ planCourses, catalog, student, careerIds: [career.id] })
    .filter(({ course }) => careerFit(course, [career.id]) > 0)
    .slice(0, 3)
    .map((r) => r.course);

  const blocked = catalog
    .filter((c) => careerFit(c, [career.id]) > 0 && !planCourses.some((p) => p.code === c.code) && !fits.includes(c))
    .map((c) => {
      const clash = conflictsWith(c, planCourses)[0];
      const missing = prerequisiteStatus(c, student, planCourses).filter((p) => p.status === 'missing');
      if (clash) return `${c.title} clashes with ${clash.title}`;
      if (missing.length) return `${c.title} needs ${missing.map((m) => m.label).join(', ')} first`;
      return null;
    })
    .filter(Boolean);

  let text = `For a career as **${career.label}** (${career.demand}, ${career.salary}) the H-OS skill graph maps these milestones:\n${list(lines)}`;
  text += fits.length
    ? `\n\nThese electives fit your timetable with **no overlap** and all prerequisites met:`
    : `\n\nNo additional elective for this pathway fits your current timetable without a clash.`;
  if (blocked.length) text += `\n\nNot recommended right now:\n${list(blocked)}`;
  return { text, cards: fits.map((c) => c.code), bulkAdd: fits.length > 1 ? fits.map((c) => c.code) : undefined };
}

function compareReply([a, b], ctx) {
  if (ctx.mode === 'concept') {
    const topicsA = new Set(a.syllabus.topics.map((t) => t.toLowerCase()));
    const shared = b.syllabus.topics.filter((t) => topicsA.has(t.toLowerCase()));
    const onlyA = a.syllabus.topics.filter((t) => !shared.some((s) => s.toLowerCase() === t.toLowerCase()));
    const onlyB = b.syllabus.topics.filter((t) => !shared.some((s) => s.toLowerCase() === t.toLowerCase()));
    let text = `**${a.title}** — ${a.syllabus.summary}\n\n**${b.title}** — ${b.syllabus.summary}`;
    text += `\n\nOnly in ${a.title}: ${onlyA.join(', ')}.\nOnly in ${b.title}: ${onlyB.join(', ')}.`;
    if (shared.length) text += `\nShared ground: ${shared.join(', ')}.`;
    text += `\n\nRule of thumb: ${a.title} asks *"what patterns or insights are in this data?"* while ${b.title} asks *"what can a model predict from it?"*`;
    return { text, cards: [a.code, b.code] };
  }

  const row = (c) => {
    const missing = prerequisiteStatus(c, ctx.student, ctx.planCourses).filter((p) => p.status === 'missing');
    const clash = conflictsWith(c, ctx.planCourses)[0];
    return `**${c.title}** — ${c.cfu} CFU · ${formatSchedule(c)} · workload ${c.workload.toFixed(1)}/5 · reviews ${c.reviewScore ?? 'n/a'}/5\n   ${
      missing.length ? `⚠️ Missing prerequisite: ${missing.map((m) => m.label).join(', ')}` : '✅ Prerequisites met'
    }${clash ? ` · 🔥 clashes with ${clash.title}` : ''}`;
  };
  return {
    text: `Planning view of both courses against your draft:\n\n${row(a)}\n\n${row(b)}\n\nSwitch to **Course Concept** mode for a syllabus-level comparison.`,
    cards: [a.code, b.code],
  };
}

function fillReply(message, ctx) {
  const { planCourses, catalog, student } = ctx;
  const { total } = planTotals(planCourses);
  const asked = Number(message.match(/(\d+)\s*(cfu|credit)/i)?.[1]);
  const shortage = asked || student.semesterTargetCfu - total;
  if (shortage <= 0) {
    return { text: `Your draft already totals **${total} CFU**, meeting the ${student.semesterTargetCfu} CFU semester target. 🎉` };
  }
  const fillers = findFillers({ shortage, planCourses, catalog, student });
  if (!fillers.length) {
    return { text: `I couldn't find courses worth ${shortage} CFU that fit your timetable and prerequisites. Try dropping a draft course or ask Prof. Rossi about an independent study.` };
  }
  const sum = fillers.reduce((s, c) => s + c.cfu, 0);
  return {
    text: `Your draft has **${total} CFU**. To cover **${shortage} CFU** I checked every catalogue course against your timetable and completed prerequisites. ${
      fillers.length === 1 ? 'Best fit' : 'Best combination'
    } (${sum} CFU, zero overlaps):`,
    cards: fillers.map((c) => c.code),
    bulkAdd: fillers.length > 1 ? fillers.map((c) => c.code) : undefined,
  };
}

function conflictReply(ctx) {
  const conflicts = findConflicts(ctx.planCourses);
  if (!conflicts.length) return { text: 'Good news — your draft has **no timetable overlaps**. ✅' };
  const recs = [];
  const lines = conflicts.map(({ a, b, windows }) => {
    const drop = a.type === 'compulsory' ? b : a;
    const rec = recommendReplacement({ drop, planCourses: ctx.planCourses, catalog: ctx.catalog, student: ctx.student });
    if (rec) recs.push(rec.code);
    return `${a.title} ↔ ${b.title} (${windows.map((w) => w.day).join(', ')})${rec ? ` → swap ${drop.title} for ${rec.title}` : ''}`;
  });
  return { text: `I found ${conflicts.length} overlap(s) in your draft:\n${list(lines)}`, cards: recs };
}

function prereqReply(course, ctx) {
  const statuses = prerequisiteStatus(course, ctx.student, ctx.planCourses);
  if (!statuses.length) return { text: `**${course.title}** has no prerequisites — you can take it right away.`, cards: [course.code] };
  const icon = { met: '✅', concurrent: '📘', missing: '❌' };
  const providers = statuses
    .filter((s) => s.status === 'missing')
    .map((s) => ctx.catalog.find((c) => c.provides === s.id)?.code)
    .filter(Boolean);
  return {
    text: `Prerequisites for **${course.title}**:\n${list(statuses.map((s) => `${icon[s.status]} ${s.label} — ${s.status}`))}${
      providers.length ? '\n\nYou can close the gap this semester with:' : ''
    }`,
    cards: providers.length ? providers : [course.code],
  };
}

function explainReply(course, ctx) {
  if (ctx.mode === 'concept') {
    const math = course.prerequisites.filter((p) => ['linalg', 'calc', 'stats'].includes(p));
    return {
      text: `**${course.title}** (${course.code}) — ${course.syllabus.summary}\n\nKey syllabus topics:\n${list(course.syllabus.topics)}${
        math.length ? `\n\nMaths you'll lean on: ${math.map(skillLabel).join(', ')}. Ask me about any topic (e.g. "explain gradient descent").` : ''
      }`,
      cards: [course.code],
    };
  }
  const clash = conflictsWith(course, ctx.planCourses)[0];
  const missing = prerequisiteStatus(course, ctx.student, ctx.planCourses).filter((p) => p.status === 'missing');
  return {
    text: `**${course.title}** — ${course.cfu} CFU, ${formatSchedule(course)}, ${course.lecturer}. Assessment: ${course.assessment}.\n${
      clash ? `🔥 Clashes with ${clash.title} in your draft.` : '✅ Fits your timetable.'
    } ${missing.length ? `⚠️ Missing: ${missing.map((m) => m.label).join(', ')}.` : '✅ Prerequisites met.'}`,
    cards: [course.code],
  };
}

function progressReply(ctx) {
  const { student, planCourses } = ctx;
  const { total, byBucket } = planTotals(planCourses);
  const done = Object.values(student.completedCfu).reduce((s, v) => s + v, 0);
  const rows = DEGREE_REQUIREMENTS.buckets.map(
    (b) => `${b.label}: ${student.completedCfu[b.id]}/${b.required} CFU${byBucket[b.id] ? ` (+${byBucket[b.id]} in draft)` : ''}`,
  );
  return {
    text: `You've completed **${done}/${DEGREE_REQUIREMENTS.totalCfu} CFU**. This draft adds ${total} CFU, bringing you to ${done + total} CFU.\n${list(rows)}\n\nRemaining after this semester: ${
      DEGREE_REQUIREMENTS.totalCfu - done - total
    } CFU.`,
  };
}

function conceptReply(message) {
  const lower = message.toLowerCase();
  const hit = CONCEPT_GLOSSARY.find((g) => g.terms.some((t) => lower.includes(t)));
  return hit ? { text: hit.text, cards: [hit.course] } : null;
}

/** @returns {TutorReply} */
export function tutorRespond(message, { mode, catalog, plan, student }) {
  const byCode = Object.fromEntries(catalog.map((c) => [c.code, c]));
  const ctx = { mode, catalog, student, planCourses: plan.map((p) => byCode[p.code]).filter(Boolean) };
  const lower = message.toLowerCase();
  const courses = matchCourses(message, catalog);

  if (courses.length >= 2 && /(difference|differ|\bvs\.?\b|versus|compare)/.test(lower)) return compareReply(courses, ctx);
  if (/(remaining|fill|complete|top up|short)/.test(lower) && /(cfu|credit)/.test(lower)) return fillReply(message, ctx);

  const glossary = conceptReply(message);
  if (glossary && (mode === 'concept' || /(explain|what is|what are|how does)/.test(lower))) return glossary;

  const career = matchCareer(message);
  if (career || /(career|job)/.test(lower)) {
    return careerReply(career ?? CAREERS.find((c) => c.id === student.careerGoals[0]), ctx);
  }
  if (/(conflict|overlap|clash)/.test(lower)) return conflictReply(ctx);
  if (courses.length && /(prereq|prerequisite|can i take|eligible)/.test(lower)) return prereqReply(courses[0], ctx);
  if (courses.length) return explainReply(courses[0], ctx);
  if (/(progress|graduat|degree|how many|credits?)/.test(lower)) return progressReply(ctx);

  const conflicts = findConflicts(ctx.planCourses).length;
  return {
    text:
      mode === 'concept'
        ? 'In **Course Concept** mode I explain syllabus topics and prerequisite maths. Try "Explain Machine Learning", "What is gradient descent?" or "Data Mining vs Machine Learning".'
        : `In **Study Planner** mode I can find non-conflicting electives, check prerequisites and map courses to careers. ${
            conflicts ? `Heads-up: your draft currently has ${conflicts} timetable overlap(s) — ask me "how do I fix my conflicts?"` : 'Your draft currently has no overlaps.'
          }`,
  };
}
