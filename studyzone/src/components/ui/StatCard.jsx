import { cn } from '../../lib/utils'
import { ProgressBar } from './ProgressBar'

export function StatCard({
  label,
  value,
  detail,
  progress,
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface px-4 py-3.5 sm:px-5 sm:py-4',
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {detail && (
          <p className="text-xs text-muted">{detail}</p>
        )}
      </div>
      {typeof progress === 'number' && (
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>
      )}
    </div>
  )
}
