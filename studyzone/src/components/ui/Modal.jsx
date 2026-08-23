import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { modalBackdrop, modalPanel } from '../../lib/motion'

/**
 * Reusable modal dialog component.
 *
 * @param {boolean} open
 * @param {Function} onClose
 * @param {string} title
 * @param {string} [description]
 * @param {React.ReactNode} children
 * @param {string} [maxWidth='max-w-lg']
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`relative z-10 w-full ${maxWidth} rounded-2xl border border-border bg-surface shadow-xl overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 id="modal-title" className="text-sm font-semibold text-foreground">
                  {title}
                </h2>
                {description && (
                  <p className="text-[11px] text-muted mt-0.5">{description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
