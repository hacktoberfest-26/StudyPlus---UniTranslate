import { useMemo, useState } from 'react';
import { Database, FileText, ChevronDown, CircleCheck, CircleAlert, Sparkles } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { RAW_SYLLABUS_FEED } from '../../brain/rawFeed.js';
import { findConflicts } from '../../librarian/schedule.js';

/** Department Admin view of the Librarian: Brain health + unstructured syllabus ingestion. */
export function LibrarianConsole() {
  const catalog = usePlanStore((s) => s.catalog);
  const report = usePlanStore((s) => s.ingestReport);
  const runIngest = usePlanStore((s) => s.runIngest);
  const [open, setOpen] = useState(true);

  const stats = useMemo(() => {
    const clashes = findConflicts(catalog).length;
    const sessions = catalog.reduce((n, c) => n + c.sessions.length, 0);
    return { courses: catalog.length, sessions, clashes, cfu: catalog.reduce((n, c) => n + c.cfu, 0) };
  }, [catalog]);

  return (
    <section className="bg-ink-900 text-ink-100 rounded-lg" aria-label="Librarian console">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold">
        <span className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-300" aria-hidden /> Course data import (Librarian)
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="px-3 pb-3 grid gap-3 lg:grid-cols-[auto_1fr]">
          <dl className="grid grid-cols-4 lg:grid-cols-2 gap-2 text-center">
            {[
              ['Courses', stats.courses],
              ['Sessions', stats.sessions],
              ['Catalogue CFU', stats.cfu],
              ['Slot clashes', stats.clashes],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink-800 rounded-lg px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-ink-400">{k}</dt>
                <dd className="text-lg font-bold">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="bg-ink-800 rounded-lg p-3 space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-300">
                {RAW_SYLLABUS_FEED.length} unstructured records waiting in the ingestion queue (PDF scans & spreadsheet exports).
              </p>
              <button
                onClick={runIngest}
                disabled={!!report}
                className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-ink-600 disabled:cursor-not-allowed text-ink-900 text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden /> {report ? 'Feed ingested' : 'Run Librarian Ingestion'}
              </button>
            </div>
            <ul className="space-y-1.5">
              {(report ?? RAW_SYLLABUS_FEED.map((r) => ({ source: r.source, pending: true, text: r.text }))).map((r) => (
                <li key={r.source} className="text-xs bg-ink-900/60 rounded-md p-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" aria-hidden />
                    <span className="font-mono text-ink-300 truncate">{r.source}</span>
                    {!r.pending &&
                      (r.publishable ? (
                        <span className="ml-auto flex items-center gap-1 text-green-300 shrink-0">
                          <CircleCheck className="w-3.5 h-3.5" aria-hidden /> Published {r.course.code}
                        </span>
                      ) : (
                        <span className="ml-auto flex items-center gap-1 text-amber-300 shrink-0">
                          <CircleAlert className="w-3.5 h-3.5" aria-hidden /> {r.duplicate ? 'Duplicate' : 'Quarantined'}
                        </span>
                      ))}
                  </div>
                  {r.pending ? (
                    <p className="font-mono text-ink-400 mt-1 break-all">{r.text}</p>
                  ) : (
                    r.issues.length > 0 && (
                      <ul className="mt-1 pl-5 list-disc text-ink-400">
                        {r.issues.map((i, idx) => (
                          <li key={idx} className={i.level === 'error' ? 'text-red-300' : ''}>
                            {i.level === 'error' ? 'Blocking' : 'Fixed'} · {i.message}
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
