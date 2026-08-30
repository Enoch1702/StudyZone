import { cn } from '../../lib/utils'

const cardVariants = {
  default:
    'border border-border/85 bg-gradient-to-b from-surface via-surface to-surface-raised/40 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.07)] hover:border-border transition-all',
  subtle: 'border border-border-subtle bg-surface-subtle/80 backdrop-blur-xs',
  elevated:
    'border border-border/85 bg-gradient-to-b from-surface via-surface-raised/40 to-surface-raised shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)]',
  interactive:
    'border border-border/80 bg-gradient-to-b from-surface via-surface to-surface-raised/30 hover:border-accent/40 hover:from-surface hover:to-accent-muted/10 hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 cursor-pointer',
  highlighted:
    'border border-accent/40 border-l-4 border-l-accent bg-gradient-to-r from-accent-muted/20 via-surface to-surface shadow-[0_4px_16px_0_rgba(37,99,235,0.07)]',
  danger: 'border border-danger/30 bg-gradient-to-br from-danger-muted/20 via-surface to-surface shadow-xs',
  ai: 'border border-ai-accent/35 bg-gradient-to-br from-ai-muted/25 via-surface to-surface shadow-[0_4px_16px_0_rgba(124,58,237,0.08)]',
  gradient:
    'border border-accent/25 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-surface dark:from-blue-950/20 dark:via-surface dark:to-surface shadow-[0_4px_16px_0_rgba(37,99,235,0.06)]',
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
