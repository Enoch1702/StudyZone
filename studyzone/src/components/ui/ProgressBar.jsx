import { cn } from '../../lib/utils'

export function ProgressBar({ value, className, color }) {
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-border-subtle', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color ?? 'var(--color-accent)',
        }}
      />
    </div>
  )
}
