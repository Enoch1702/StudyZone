import { cn } from '../../lib/utils'

const cardVariants = {
  default:
    'border border-border/80 bg-surface shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.05)]',
  subtle: 'border border-border-subtle bg-surface-subtle',
  elevated:
    'border border-border/80 bg-surface-raised shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]',
  interactive:
    'border border-border/80 bg-surface hover:border-accent/40 hover:bg-surface-raised/40 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer',
  highlighted:
    'border border-accent/30 border-l-4 border-l-accent bg-gradient-to-r from-accent-muted/20 via-surface to-surface shadow-[0_2px_8px_0_rgba(37,99,235,0.06)]',
  danger: 'border border-danger/30 bg-danger-muted/15 shadow-xs',
  ai: 'border border-ai-accent/30 bg-gradient-to-br from-ai-muted/20 via-surface to-surface shadow-[0_2px_8px_0_rgba(124,58,237,0.06)]',
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
        'rounded-2xl p-5 sm:p-6 transition-all duration-200 text-foreground',
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
