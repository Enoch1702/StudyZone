import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowRight,
  Sparkles,
  Timer,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

export function SmartNextActionCard({ action, onDismiss }) {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  if (!action || dismissed) return null

  function handleStartFocus() {
    if (action.action?.route) {
      navigate(action.action.route, { state: action.action.state })
    }
  }

  function handleViewTask() {
    if (action.type === 'deadline') {
      navigate('/deadlines')
    } else {
      navigate('/tasks')
    }
  }

  function handleDismiss() {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  const badgeVariant =
    action.badgeVariant === 'danger'
      ? 'danger'
      : action.badgeVariant === 'warning'
      ? 'warning'
      : 'accent'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="w-full"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-accent bg-surface p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left Content */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent border border-accent/20">
                <Zap className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-accent" />
                    Best Next Action
                  </span>
                  <span
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      badgeVariant === 'danger'
                        ? 'bg-danger-muted text-danger border-danger/30'
                        : badgeVariant === 'warning'
                        ? 'bg-warning-muted text-warning border-warning/30'
                        : 'bg-accent-muted text-accent border-accent/30',
                    )}
                  >
                    {action.badge}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {action.title}
                </h3>

                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  <span className="font-medium text-foreground">Reason: </span>
                  {action.reason}
                </p>

                {action.subjectName && (
                  <span className="inline-block mt-2 rounded-md bg-surface-raised border border-border px-2 py-0.5 text-[10px] font-semibold text-muted">
                    {action.subjectName}
                  </span>
                )}
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                type="button"
                size="sm"
                onClick={handleStartFocus}
                className="gap-2 font-bold shadow-md shadow-accent/20 cursor-pointer"
              >
                <Timer className="h-4 w-4" />
                <span>Start Focus</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleViewTask}
                className="gap-1.5 text-xs text-muted hover:text-foreground cursor-pointer"
              >
                <span>View</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                aria-label="Dismiss recommendation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
