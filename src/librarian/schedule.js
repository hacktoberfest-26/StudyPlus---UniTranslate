/**
 * Librarian — timetable utilities and conflict detection.
 */
import { DAY_LABELS } from '../brain/courses.js';

export function formatHour(h) {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatSession(s) {
  return `${s.day} ${formatHour(s.start)}-${formatHour(s.end)}`;
}

export function formatSchedule(course) {
  return course.sessions.map(formatSession).join(', ');
}

export function dayLabel(day) {
  return DAY_LABELS[day] ?? day;
}

/** Half-open interval overlap: [a.start, a.end) ∩ [b.start, b.end) ≠ ∅ on the same day. */
export function sessionsOverlap(a, b) {
  return a.day === b.day && a.start < b.end && b.start < a.end;
}

export function overlapWindow(a, b) {
  return { day: a.day, start: Math.max(a.start, b.start), end: Math.min(a.end, b.end) };
}

/** All session-level collisions between two courses. */
export function courseCollisions(a, b) {
  const windows = [];
  for (const sa of a.sessions) {
    for (const sb of b.sessions) {
      if (sessionsOverlap(sa, sb)) windows.push(overlapWindow(sa, sb));
    }
  }
  return windows;
}

/** Pairwise conflicts within a list of courses. */
export function findConflicts(courses) {
  const conflicts = [];
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const windows = courseCollisions(courses[i], courses[j]);
      if (windows.length) conflicts.push({ a: courses[i], b: courses[j], windows });
    }
  }
  return conflicts;
}

/** Courses in `others` that collide with `course`. */
export function conflictsWith(course, others) {
  return others.filter((o) => o.code !== course.code && courseCollisions(course, o).length > 0);
}
