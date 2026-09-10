import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './Button'

/**
 * Standardized ErrorState component for failed fetches and broken views.
 * Avoids raw database jargon and provides a clear retry action.
 *
 * @param {string} [title='Something went wrong']
 * @param {string} [message='We encountered an issue loading this information. Please try again.']
 * @param {Function} [onRetry]
 * @param {string} [retryLabel='Try Again']
 * @param {string} [className]
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an issue loading this information. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-10 text-center shadow-xs',
        className,
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-danger/20 bg-danger/10 text-danger">
        <AlertCircle className="h-5 w-5" />
      </div>

      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      {message && (
        <p className="mt-1 max-w-md text-xs sm:text-sm text-muted leading-relaxed">
          {message}
        </p>
      )}

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{retryLabel}</span>
        </Button>
      )}
    </div>
  )
}
