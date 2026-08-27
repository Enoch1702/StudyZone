import { cn } from '../../lib/utils'
import { ProgressBar } from './ProgressBar'
import { AnimatedNumber } from './AnimatedNumber'

export function StatCard({
  label,
  value,
  detail,
  progress,
  variant = 'default',
  icon: Icon,
  className,
}) {
  // Determine if value is a number (animate it) or a formatted string (show as-is)
  const isNumeric = typeof value === 'number'
  // Handle "75%" style — extract numeric part
  const percentMatch = typeof value === 'string' ? value.match(/^(\d+(?:\.\d+)?)(%?)$/) : null

  const indicatorDot = {
    default: 'bg-muted-foreground/50',
    success: 'bg-success shadow-xs shadow-success/40',
    warning: 'bg-warning shadow-xs shadow-warning/40',
    accent: 'bg-accent shadow-xs shadow-accent/40',
  }

  return (
    <div
      className={cn(
        'group rounded-xl border border-border bg-surface px-4 py-3.5 sm:px-5 sm:py-4 shadow-xs',
        'transition-all duration-200 hover:border-border-strong hover:bg-surface-raised/40 hover:-translate-y-0.5 hover:shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted flex items-center gap-1.5">
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', indicatorDot[variant] || indicatorDot.default)} />
          <span>{label}</span>
        </p>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {isNumeric ? (
            <AnimatedNumber value={value} />
          ) : percentMatch ? (
            <AnimatedNumber value={Number(percentMatch[1])} suffix={percentMatch[2]} />
          ) : (
            value
          )}
        </p>
        {detail && (
          <p className="text-xs text-muted font-medium">{detail}</p>
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
