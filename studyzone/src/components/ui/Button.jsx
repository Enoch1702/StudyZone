import { cn } from '../../lib/utils'

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-xs hover:shadow-sm focus-visible:ring-accent/40',
  secondary:
    'bg-surface text-foreground border border-border hover:bg-surface-raised hover:border-border-strong active:scale-[0.98] focus-visible:ring-border',
  outline:
    'bg-transparent text-foreground border border-border hover:bg-surface-raised hover:border-border-strong active:scale-[0.98] focus-visible:ring-border',
  ghost:
    'text-muted hover:text-foreground hover:bg-surface-raised active:scale-[0.98] focus-visible:ring-border',
  danger:
    'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 active:scale-[0.98] focus-visible:ring-danger/40',
  ai:
    'bg-ai-accent text-white hover:opacity-90 active:scale-[0.98] shadow-xs focus-visible:ring-ai-accent/40',
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
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant] || variants.primary,
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
