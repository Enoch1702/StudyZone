import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={Boolean(error)}
      className={cn(
        'flex h-9 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground shadow-xs',
        'placeholder:text-muted-foreground',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error
          ? 'border-danger focus-visible:ring-danger/30 focus-visible:border-danger'
          : 'border-border focus-visible:ring-accent/30 focus-visible:border-accent hover:border-border-strong',
        className,
      )}
      {...props}
    />
  )
})

export const Select = forwardRef(function Select(
  { className, error, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={Boolean(error)}
      className={cn(
        'flex h-9 rounded-lg border bg-surface px-3 py-1.5 text-sm text-foreground shadow-xs cursor-pointer',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error
          ? 'border-danger focus-visible:ring-danger/30 focus-visible:border-danger'
          : 'border-border focus-visible:ring-accent/30 focus-visible:border-accent hover:border-border-strong',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})

export const Textarea = forwardRef(function Textarea(
  { className, error, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={Boolean(error)}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground shadow-xs',
        'placeholder:text-muted-foreground',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        error
          ? 'border-danger focus-visible:ring-danger/30 focus-visible:border-danger'
          : 'border-border focus-visible:ring-accent/30 focus-visible:border-accent hover:border-border-strong',
        className,
      )}
      {...props}
    />
  )
})

