import { cn } from '../../lib/utils'

const cardVariants = {
  default: 'border border-border bg-surface shadow-xs',
  subtle: 'border border-border-subtle bg-surface-subtle',
  elevated: 'border border-border/80 bg-surface-raised shadow-md',
  interactive:
    'border border-border bg-surface hover:border-border-strong hover:bg-surface-raised/50 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer',
  highlighted:
    'border border-border border-l-4 border-l-accent bg-surface shadow-xs',
  danger: 'border border-danger/30 bg-danger-muted/20',
  ai: 'border border-ai-accent/30 bg-ai-muted/15 shadow-xs',
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
        'rounded-xl p-5 transition-all duration-200 text-foreground',
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
