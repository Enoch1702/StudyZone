import { cn } from '../../lib/utils'

export function LoadingSpinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label="Loading"
    >
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-border border-t-accent',
          sizes[size],
        )}
      />
    </div>
  )
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <LoadingSpinner />
      <p className="text-sm text-muted">{message}</p>
    </div>
  )
}
