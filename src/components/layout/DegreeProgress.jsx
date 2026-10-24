import { DEGREE_REQUIREMENTS, STUDENT } from '../../brain/student.js';
import { usePlanSummary } from '../../store/derived.js';

/** 3-year progress: solid = completed CFU, striped = credits planned this semester. */
export function DegreeProgress() {
  const { byBucket, total: draftTotal } = usePlanSummary();
  const { totalCfu, buckets } = DEGREE_REQUIREMENTS;
  const completed = Object.values(STUDENT.completedCfu).reduce((s, v) => s + v, 0);
  const pct = (v) => `${(v / totalCfu) * 100}%`;

  return (
    <section data-tour="progress" className="px-4 sm:px-6 py-3" aria-label="Degree progress">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h2 className="text-sm font-semibold text-slate-700">3-Year Degree Progress</h2>
        <span className="text-sm text-slate-600">
          <span className="font-bold text-slate-900">
            {completed} / {totalCfu} CFU
          </span>{' '}
          completed{draftTotal > 0 && <span className="text-indigo-600 font-medium"> · +{draftTotal} CFU planned this semester</span>}
        </span>
      </div>

      <div
        className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalCfu}
        aria-valuenow={completed}
        aria-valuetext={`${completed} of ${totalCfu} CFU completed, ${draftTotal} planned`}
      >
        {buckets.map((b) => (
          <div key={`done-${b.id}`} className={`${b.bar} h-full transition-all duration-500`} style={{ width: pct(STUDENT.completedCfu[b.id]) }} />
        ))}
        {buckets.map((b) => (
          <div key={`draft-${b.id}`} className={`${b.bar} striped opacity-60 h-full transition-all duration-500`} style={{ width: pct(byBucket[b.id] ?? 0) }} />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
        {buckets.map((b) => (
          <div key={b.id} className="flex items-center gap-2 text-xs">
            <span className={`w-3 h-3 ${b.bar} rounded-full`} aria-hidden />
            <span className="text-slate-600">
              {b.label}: <span className="font-semibold text-slate-800">{STUDENT.completedCfu[b.id]}</span>/{b.required} CFU
              {byBucket[b.id] > 0 && <span className={b.text}> (+{byBucket[b.id]} planned)</span>}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-full bg-indigo-400 striped" aria-hidden /> Striped = planned this semester
        </div>
      </div>
    </section>
  );
}
