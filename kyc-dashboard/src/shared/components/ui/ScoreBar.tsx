/**
 * Barra visual de score/confianza — muestra valor numérico con color semáforo.
 */
import clsx from 'clsx';

interface ScoreBarProps {
  value:       number | null | undefined;   // 0.0–1.0
  threshold?:  number;                       // umbral de advertencia (ej. 0.70)
  showPercent?:boolean;
  height?:     'sm' | 'md';
}

export function ScoreBar({
  value,
  threshold = 0,
  showPercent = true,
  height = 'sm',
}: ScoreBarProps) {
  if (value == null) {
    return <span className="text-xs text-gray-400">N/D</span>;
  }

  const pct      = Math.max(0, Math.min(1, value)) * 100;
  const passing  = value >= threshold;

  const barColor = pct >= 90 ? 'bg-green-500'
                 : pct >= 70 ? 'bg-amber-400'
                 :             'bg-red-500';

  const textColor = passing ? 'text-green-600 dark:text-green-400'
                             : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          'flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
          height === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(pct)}%`}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showPercent && (
        <span className={clsx('text-xs font-semibold tabular-nums w-9 text-right', textColor)}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
