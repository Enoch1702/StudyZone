import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { modalBackdrop, modalPanel } from '../../lib/motion'

/**
 * Reusable accessible modal dialog component.
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
  const panelRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (!open) return

    previousActiveElement.current = document.activeElement

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    // Auto focus first interactive element or panel
    const timer = setTimeout(() => {
      if (panelRef.current) {
        const firstFocusable = panelRef.current.querySelector(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        )
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }
    }, 50)

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus()
      }
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
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
            ref={panelRef}
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`relative z-10 flex max-h-[92vh] w-full ${maxWidth} flex-col rounded-xl border border-border bg-surface shadow-lg overflow-hidden`}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5 sm:px-6 sm:py-4">
              <div className="min-w-0 pr-3">
                <h2 id="modal-title" className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {title}
                </h2>
                {description && (
                  <p className="text-xs text-muted mt-0.5 truncate">{description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content with vertical scroll */}
            <div className="overflow-y-auto p-5 sm:p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
