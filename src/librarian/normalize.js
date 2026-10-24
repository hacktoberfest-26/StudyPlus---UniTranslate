/**
 * Librarian — normalises course records into the H-OS Brain schema and reports data issues.
 *
 * A record with blocking issues (no code/title, no CFU, no schedule) is quarantined
 * rather than published to the catalogue.
 */
import { DAYS, CAMPUSES, COURSE_TYPES } from '../brain/courses.js';
import { SKILL_NODES } from '../brain/skillGraph.js';

const WORD_NUMBERS = { three: 3, six: 6, nine: 9, twelve: 12 };

const DAY_ALIASES = {
  mon: 'Mon', monday: 'Mon',
  tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
  wed: 'Wed', wednesday: 'Wed',
  thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu',
  fri: 'Fri', friday: 'Fri',
};

export function normalizeDay(value) {
  if (!value) return null;
  return DAY_ALIASES[String(value).trim().toLowerCase()] ?? null;
}

export function normalizeCampus(value) {
  const v = String(value ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (v.includes('hfarm')) return 'h-farm';
  if (v.includes('foscari') || v.includes('main')) return 'ca-foscari';
  return null;
}

export function normalizeFormat(value) {
  const v = String(value ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (v.includes('hybrid')) return 'hybrid';
  if (v.includes('person')) return 'in-person';
  return null;
}

export function parseCfu(value) {
  if (typeof value === 'number') return value;
  const v = String(value ?? '').toLowerCase();
  const digits = v.match(/\d+/);
  if (digits) return Number(digits[0]);
  const word = Object.keys(WORD_NUMBERS).find((w) => v.includes(w));
  return word ? WORD_NUMBERS[word] : null;
}

/** "wed 16:00-18:00" | "Thursday 08:00-10:00" → { day, start, end } */
export function parseSessionText(value) {
  const m = String(value ?? '').match(/([a-z]+)\s+(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/i);
  if (!m) return null;
  const day = normalizeDay(m[1]);
  if (!day) return null;
  const start = Number(m[2]) + Number(m[3] ?? 0) / 60;
  const end = Number(m[4]) + Number(m[5] ?? 0) / 60;
  return end > start ? { day, start, end } : null;
}

export function skillIdFromLabel(label) {
  const v = String(label).trim().toLowerCase();
  return SKILL_NODES.find((n) => n.label.toLowerCase() === v || n.id === v)?.id ?? null;
}

/**
 * @returns {{ course: object, issues: { level: 'error'|'warning', field: string, message: string }[], publishable: boolean }}
 */
export function normalizeCourse(raw) {
  const issues = [];
  const err = (field, message) => issues.push({ level: 'error', field, message });
  const warn = (field, message) => issues.push({ level: 'warning', field, message });

  const code = String(raw.code ?? '').trim().toUpperCase();
  const title = String(raw.title ?? '').trim();
  if (!code) err('code', 'Missing course code');
  if (!title) err('title', 'Missing course title');

  const cfu = parseCfu(raw.cfu);
  if (!cfu) err('cfu', 'CFU credits could not be parsed');
  else if (typeof raw.cfu !== 'number' && !/\d/.test(String(raw.cfu))) warn('cfu', `CFU written as text ("${raw.cfu}") — normalised to ${cfu}`);

  const sessions = (raw.sessions ?? [])
    .map((s) => (typeof s === 'string' ? parseSessionText(s) : { ...s, day: normalizeDay(s.day) ?? s.day }))
    .filter((s) => s && DAYS.includes(s.day))
    .map((s) => ({ room: raw.room ?? 'TBA', ...s }));
  if (!sessions.length) err('sessions', 'No valid timetable slot (Mon–Fri 08:00–18:00)');
  sessions.forEach((s) => {
    if (s.start < 8 || s.end > 18) warn('sessions', `Slot ${s.day} ${s.start}-${s.end} outside teaching hours`);
  });

  const lecturer = String(raw.lecturer ?? '').trim();
  if (!lecturer || lecturer.includes('?')) warn('lecturer', 'Lecturer not assigned');

  const campus = normalizeCampus(raw.campus);
  if (!campus) warn('campus', 'Unknown campus — defaulted to H-FARM Campus');

  const format = normalizeFormat(raw.format);
  if (!format) warn('format', 'Unknown teaching format — defaulted to In-Person');

  const type = COURSE_TYPES[raw.type] ? raw.type : 'elective';
  const prerequisites = (raw.prerequisites ?? [])
    .map((p) => {
      const id = skillIdFromLabel(p);
      if (!id) warn('prerequisites', `Unknown prerequisite "${p}" dropped`);
      return id;
    })
    .filter(Boolean);

  const attendancePct = String(raw.attendance ?? '').match(/\d+/)?.[0];
  if (!attendancePct) warn('attendance', 'Attendance requirement missing');

  const course = {
    code,
    title,
    cfu: cfu ?? 0,
    lecturer: lecturer && !lecturer.includes('?') ? lecturer : 'To be assigned',
    type,
    bucket: raw.bucket ?? (type === 'compulsory' ? 'core' : type === 'thesis' ? 'thesis' : 'electives'),
    campus: campus ?? 'h-farm',
    format: format ?? 'in-person',
    attendance: attendancePct ? `Compulsory ${attendancePct}%` : 'Not specified',
    sessions,
    prerequisites,
    provides: raw.provides ?? code.toLowerCase(),
    workload: raw.workload ?? 3.5,
    reviewScore: raw.reviewScore ?? null,
    assessment: raw.assessment ?? 'To be confirmed',
    aliases: raw.aliases ?? [],
    syllabus: raw.syllabus ?? { summary: 'Syllabus ingested by the Librarian — full description pending.', topics: [] },
    source: raw.source ?? 'brain',
  };

  return { course, issues, publishable: !issues.some((i) => i.level === 'error') };
}

export function campusLabel(id) {
  return CAMPUSES[id]?.label ?? id;
}
