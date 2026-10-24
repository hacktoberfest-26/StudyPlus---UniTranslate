/**
 * Derived app state. Selectors return stable slices; heavy computation is memoised here
 * so every component sees the same real-time view of the plan.
 */
import { useMemo } from 'react';
import { usePlanStore } from './usePlanStore.js';
import { STUDENT } from '../brain/student.js';
import { runProactiveAgents } from '../agents/proactiveAgent.js';
import { planTotals } from '../agents/planning.js';
import { findConflicts } from '../librarian/schedule.js';

export function useCatalogIndex() {
  const catalog = usePlanStore((s) => s.catalog);
  return useMemo(() => Object.fromEntries(catalog.map((c) => [c.code, c])), [catalog]);
}

/** Plan entries joined with their Brain course records. */
export function usePlanCourses() {
  const plan = usePlanStore((s) => s.plan);
  const index = useCatalogIndex();
  return useMemo(
    () => plan.map((p) => index[p.code] && { ...index[p.code], status: p.status }).filter(Boolean),
    [plan, index],
  );
}

export function useAlerts() {
  const plan = usePlanStore((s) => s.plan);
  const catalog = usePlanStore((s) => s.catalog);
  return useMemo(() => runProactiveAgents({ plan, catalog, student: STUDENT }), [plan, catalog]);
}

export function usePlanSummary() {
  const planCourses = usePlanCourses();
  return useMemo(() => {
    const totals = planTotals(planCourses);
    const conflicts = findConflicts(planCourses);
    const conflictCodes = new Set(conflicts.flatMap(({ a, b }) => [a.code, b.code]));
    return { planCourses, ...totals, conflicts, conflictCodes };
  }, [planCourses]);
}
