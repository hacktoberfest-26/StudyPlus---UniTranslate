/**
 * Librarian — ingests unstructured pipe-delimited syllabus text into Brain records.
 * Field order: code | title | cfu | lecturer | schedule | campus | format | key: value ...
 */
import { normalizeCourse } from './normalize.js';

export function parseRawText(text, source) {
  const parts = text.split('|').map((p) => p.trim());
  const [code, title, cfu, lecturer, schedule, campus, format, ...rest] = parts;
  const raw = { code, title, cfu, lecturer, campus, format, sessions: schedule ? [schedule] : [], source };

  for (const part of rest) {
    const m = part.match(/^([a-z]+)\s*:?\s*(.*)$/i);
    if (!m) continue;
    const [, key, value] = m;
    switch (key.toLowerCase()) {
      case 'attendance':
        raw.attendance = value;
        break;
      case 'prereq':
      case 'prerequisites':
        raw.prerequisites = value.split(',').map((v) => v.trim()).filter(Boolean);
        break;
      case 'room':
        raw.room = value;
        break;
      default:
        break;
    }
  }
  return raw;
}

/** Runs the full Librarian pipeline over a feed, skipping codes already in the catalogue. */
export function ingestFeed(feed, existingCodes = []) {
  return feed.map(({ source, text }) => {
    const raw = parseRawText(text, source);
    const result = normalizeCourse(raw);
    const duplicate = existingCodes.includes(result.course.code);
    return {
      source,
      ...result,
      duplicate,
      publishable: result.publishable && !duplicate,
    };
  });
}
