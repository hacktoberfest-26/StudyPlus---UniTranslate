/**
 * Proactive Agents — "Management by Exception".
 *
 * Runs on every draft change and returns the alerts the student must see.
 * Critical alerts are derived purely from plan state, so they cannot be dismissed:
 * the only way to clear one is to resolve the underlying conflict.
 */
import { findConflicts, formatSchedule } from '../librarian/schedule.js';
import { planTotals, prerequisiteStatus, recommendReplacement } from './planning.js';

function pickCourseToDrop(a, b, statusOf) {
  if (a.type === 'compulsory' && b.type !== 'compulsory') return { drop: b, keep: a };
  if (b.type === 'compulsory' && a.type !== 'compulsory') return { drop: a, keep: b };
  if (a.type === 'compulsory' && b.type === 'compulsory') return { drop: null, keep: a };
  if (statusOf(a.code) === 'draft' && statusOf(b.code) !== 'draft') return { drop: a, keep: b };
  return { drop: b, keep: a };
}

export function runProactiveAgents({ plan, catalog, student }) {
  const byCode = Object.fromEntries(catalog.map((c) => [c.code, c]));
  const planCourses = plan.map((p) => byCode[p.code]).filter(Boolean);
  const statusOf = (code) => plan.find((p) => p.code === code)?.status;
  const alerts = [];

  // 1. Timetable overlaps → critical, non-dismissable.
  for (const { a, b } of findConflicts(planCourses)) {
    const { drop, keep } = pickCourseToDrop(a, b, statusOf);
    const recommendation = drop ? recommendReplacement({ drop, planCourses, catalog, student }) : null;
    const subject = drop ?? b;
    alerts.push({
      id: `conflict:${[a.code, b.code].sort().join('|')}`,
      severity: 'critical',
      title: '🚨 Timetable Overlap Detected',
      message: `"${subject.title}" (${formatSchedule(subject)}) conflicts with ${keep.type === 'compulsory' ? 'compulsory ' : ''}"${keep.title}".`,
      courseCodes: [a.code, b.code],
      recommendation,
      actions: [
        recommendation && { kind: 'swap', drop: drop.code, add: recommendation.code, label: '⚡ Apply Smart Recommendation' },
        drop && { kind: 'drop', code: drop.code, label: `Drop ${drop.code}` },
        !drop && { kind: 'ask-tutor', prompt: `Both "${a.title}" and "${b.title}" are compulsory and overlap. What should I do?`, label: 'Ask AI Advisor' },
      ].filter(Boolean),
    });
    if (recommendation) {
      alerts.push({
        id: `alt:${drop.code}`,
        severity: 'success',
        title: 'Smart Alternative',
        message: `"${recommendation.title}" (${recommendation.cfu} CFU, ${formatSchedule(recommendation)}) has no timetable overlap and fulfils your ${recommendation.bucket === 'electives' ? 'elective' : recommendation.bucket} bucket.`,
        courseCodes: [recommendation.code],
        actions: [{ kind: 'preview', code: recommendation.code, label: '👁️ Ghost Preview' }],
      });
    }
  }

  // 2. Prerequisites.
  for (const course of planCourses) {
    for (const p of prerequisiteStatus(course, student, planCourses)) {
      if (p.status === 'missing') {
        const provider = catalog.find((c) => c.provides === p.id);
        alerts.push({
          id: `prereq:${course.code}:${p.id}`,
          severity: 'warning',
          title: 'Prerequisite Warning',
          message: `"${course.title}" requires "${p.label}" (${p.cfu} CFU missing).`,
          courseCodes: [course.code],
          actions: [
            provider && { kind: 'add', code: provider.code, label: `+ Add ${provider.title}` },
            { kind: 'drop', code: course.code, label: `Drop ${course.code}` },
          ].filter(Boolean),
        });
      } else if (p.status === 'concurrent') {
        alerts.push({
          id: `prereq-concurrent:${course.code}:${p.id}`,
          severity: 'info',
          title: 'Prerequisite in Progress',
          message: `"${p.label}" is in this draft — you can only sit the "${course.title}" exam after passing it.`,
          courseCodes: [course.code],
          actions: [],
        });
      }
    }
  }

  // 3. Missing compulsory courses.
  const planCodes = new Set(plan.map((p) => p.code));
  for (const course of catalog.filter((c) => c.type === 'compulsory' && !planCodes.has(c.code))) {
    alerts.push({
      id: `compulsory:${course.code}`,
      severity: 'warning',
      title: 'Compulsory Course Missing',
      message: `"${course.title}" (${course.cfu} CFU) is mandatory this semester but is not in your plan.`,
      courseCodes: [course.code],
      actions: [{ kind: 'add', code: course.code, label: `+ Add ${course.code}` }],
    });
  }

  // 4. Credit load.
  const { total } = planTotals(planCourses);
  if (total < student.semesterTargetCfu) {
    const shortage = student.semesterTargetCfu - total;
    alerts.push({
      id: 'credits:short',
      severity: 'warning',
      title: 'Credit Shortage',
      message: `Your draft totals ${total} CFU — ${shortage} CFU short of the ${student.semesterTargetCfu} CFU semester target to graduate on time.`,
      courseCodes: [],
      actions: [{ kind: 'ask-tutor', prompt: `Find non-conflicting courses to complete my remaining ${shortage} CFUs.`, label: '🤖 Find courses' }],
    });
  } else if (total > student.semesterMaxCfu) {
    alerts.push({
      id: 'credits:over',
      severity: 'warning',
      title: 'Credit Overload',
      message: `Your draft totals ${total} CFU, above the ${student.semesterMaxCfu} CFU semester maximum.`,
      courseCodes: [],
      actions: [],
    });
  }

  if (!alerts.some((a) => a.severity === 'critical' || a.severity === 'warning')) {
    alerts.push({
      id: 'all-clear',
      severity: 'success',
      title: 'Draft Ready',
      message: `No conflicts, prerequisites satisfied and ${total} CFU planned. You can submit your draft to Prof. Rossi.`,
      courseCodes: [],
      actions: [],
    });
  }

  const order = { critical: 0, warning: 1, success: 2, info: 3 };
  return alerts.sort((x, y) => order[x.severity] - order[y.severity]);
}
