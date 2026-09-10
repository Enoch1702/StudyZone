import { cn } from '../../lib/utils'

const cardVariants = {
  default:
    'border border-border bg-surface shadow-xs',
  subtle:
    'border border-border-subtle bg-surface-subtle/60',
  elevated:
    'border border-border bg-surface-raised shadow-sm',
  interactive:
    'border border-border bg-surface hover:border-border-strong hover:bg-surface-raised transition-all cursor-pointer',
  highlighted:
    'border border-accent/30 border-l-2 border-l-accent bg-surface shadow-xs',
  danger:
    'border border-danger/20 bg-danger/5 shadow-xs',
  ai:
    'border border-ai-accent/25 bg-ai-muted/10 shadow-xs',
  gradient:
    'border border-border bg-surface shadow-xs',
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        'rounded-xl p-4 sm:p-5 transition-colors text-foreground',
        cardVariants[variant] || cardVariants.default,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn('text-sm font-semibold tracking-tight text-foreground', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children }) {
  return (
    <p className={cn('mt-1 text-xs text-muted leading-relaxed', className)}>{children}</p>
  )
}
