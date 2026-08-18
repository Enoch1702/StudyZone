import { cn } from '../../lib/utils'

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent/50',
  secondary:
    'bg-surface-raised text-foreground border border-border hover:bg-border-subtle focus-visible:ring-border',
  ghost:
    'text-muted hover:text-foreground hover:bg-surface-raised focus-visible:ring-border',
  danger:
    'bg-danger/10 text-danger hover:bg-danger/20 focus-visible:ring-danger/50',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
