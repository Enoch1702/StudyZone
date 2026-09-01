import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowRight,
  Flame,
  Plus,
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

  if (dismissed) return null

  function handleStartFocus() {
    if (action?.action?.route) {
      navigate(action.action.route, { state: action.action.state })
    } else {
      navigate('/focus')
    }
  }

  function handleViewTask() {
    if (action?.type === 'deadline') {
      navigate('/deadlines')
    } else {
      navigate('/tasks')
    }
  }

  function handleDismiss() {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  // ─── If no action exists yet, render an inviting Get Started banner ───
  if (!action) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-r from-accent-muted/20 via-surface to-surface p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent flex items-center gap-1">
                  Ready to Study?
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                  Let&apos;s get your workspace in motion
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl">
                  Add your study tasks to activate automated priority ranking, or launch a quick focus session with ambient soundscapes right now.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <Button
                type="button"
                size="md"
                onClick={() => navigate('/tasks')}
                className="gap-1.5 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add a Task</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate('/focus')}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Flame className="h-4 w-4 text-amber-500" />
                <span>Quick Focus</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
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
        <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-accent-muted/25 via-surface to-surface p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.12)] hover:shadow-[0_8px_30px_-6px_rgba(37,99,235,0.18)] transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left Content */}
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30">
                <Zap className="h-5 w-5 fill-white" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Best Next Action
                  </span>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
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

                <h3 className="text-base sm:text-lg font-extrabold text-foreground truncate">
                  {action.title}
                </h3>

                <p className="text-xs text-muted mt-1 leading-relaxed">
                  <span className="font-bold text-foreground">Reason: </span>
                  {action.reason}
                </p>

                {action.subjectName && (
                  <span className="inline-block mt-2 rounded-lg bg-surface-raised border border-border px-2.5 py-1 text-[11px] font-bold text-muted">
                    {action.subjectName}
                  </span>
                )}
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <Button
                type="button"
                size="md"
                onClick={handleStartFocus}
                className="gap-2 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 cursor-pointer"
              >
                <Timer className="h-4 w-4" />
                <span>Start Focus</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleViewTask}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
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
