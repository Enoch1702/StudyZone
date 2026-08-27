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

  const iconTheme = {
    default: 'bg-surface-raised text-muted border-border/80',
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    accent: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  }

  return (
    <div
      className={cn(
        'group rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)]',
        'transition-all duration-200 hover:border-accent/40 hover:bg-surface hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted">
          {label}
        </p>
        {Icon && (
          <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg border transition-transform group-hover:scale-110', iconTheme[variant] || iconTheme.default)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <p className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
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
