import { cn } from '../../lib/utils'
import { ProgressBar } from './ProgressBar'
import { AnimatedNumber } from './AnimatedNumber'

export function StatCard({
  label,
  value,
  detail,
  progress,
  className,
}) {
  // Determine if value is a number (animate it) or a formatted string (show as-is)
  const isNumeric = typeof value === 'number'
  // Handle "75%" style — extract numeric part
  const percentMatch = typeof value === 'string' ? value.match(/^(\d+(?:\.\d+)?)(%?)$/) : null

  return (
    <div
      className={cn(
        'group rounded-lg border border-border bg-surface px-4 py-3.5 sm:px-5 sm:py-4',
        'transition-all duration-200 hover:border-border/60 hover:bg-surface-raised/30 hover:-translate-y-0.5 hover:shadow-sm',
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {isNumeric ? (
            <AnimatedNumber value={value} />
          ) : percentMatch ? (
            <AnimatedNumber value={Number(percentMatch[1])} suffix={percentMatch[2]} />
          ) : (
            value
          )}
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
