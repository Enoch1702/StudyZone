import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { modalBackdrop, modalPanel } from '../../lib/motion'

/**
 * Generic confirmation dialog modal.
 */
export function ConfirmDialog({
  open,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  const isVisible = Boolean(open ?? isOpen)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isVisible && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, loading, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => {
              if (!loading) onClose()
            }}
            aria-hidden="true"
          />

          {/* Modal card */}
          <motion.div
            className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl"
            variants={modalPanel}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 border border-danger/20 text-danger">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="confirm-dialog-title" className="text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="text-xs text-muted">Please confirm your action.</p>
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
              <p id="confirm-dialog-desc" className="text-sm leading-relaxed text-muted">
                {description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={variant}
                size="sm"
                onClick={onConfirm}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
