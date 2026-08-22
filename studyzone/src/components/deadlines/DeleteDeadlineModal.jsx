import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export function DeleteDeadlineModal({ isOpen, onClose, onConfirm, deadline, loading = false }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen || !deadline) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-deadline-title"
      aria-describedby="delete-deadline-desc"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!loading) onClose()
        }}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 border border-danger/20 text-danger">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="delete-deadline-title" className="text-base font-semibold text-foreground">
                Delete Deadline
              </h3>
              <p className="text-xs text-muted">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <p id="delete-deadline-desc" className="text-sm leading-relaxed text-muted">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">{deadline.title}</span>? This deadline
            will be permanently removed from your account.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Deadline</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
