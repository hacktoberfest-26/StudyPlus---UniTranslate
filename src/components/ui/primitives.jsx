import { useEffect } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { COURSE_TYPES } from '../../brain/courses.js';

export function TypeChip({ type }) {
  const t = COURSE_TYPES[type] ?? COURSE_TYPES.elective;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.chip}`}>{t.label}</span>;
}

export function Stars({ rating, max = 5 }) {
  if (rating == null) return <span className="text-xs text-slate-400">No data</span>;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of ${max}`}>
      {Array.from({ length: max }, (_, i) =>
        i < full ? (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" aria-hidden />
        ) : i === full && half ? (
          <StarHalf key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" aria-hidden />
        ) : (
          <Star key={i} className="w-4 h-4 text-slate-300" aria-hidden />
        ),
      )}
      <span className="text-xs text-slate-600 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

/** Minimal **bold** / *italic* renderer for tutor replies (no HTML injection). */
export function RichText({ text }) {
  return text.split('\n').map((line, li) => (
    <p key={li} className={line.trim() === '' ? 'h-2' : ''}>
      {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, pi) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={pi}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={pi}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </p>
  ));
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`view-enter bg-white w-full ${wide ? 'sm:max-w-5xl' : 'sm:max-w-lg'} max-h-[90vh] overflow-y-auto scrollbar-thin rounded-t-2xl sm:rounded-2xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
