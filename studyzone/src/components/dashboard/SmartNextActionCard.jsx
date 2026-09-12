import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowRight,
  Compass,
  Flame,
  Plus,
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
        <div className="relative overflow-hidden rounded-xl border border-border/90 bg-surface p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                  Ready to Study?
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Let&apos;s get your workspace in motion
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl">
                  Add your study tasks to activate automated priority ranking, or launch a quick focus session with ambient soundscapes right now.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                type="button"
                size="sm"
                onClick={() => navigate('/tasks')}
                className="gap-1.5 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add a Task</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => navigate('/focus')}
                className="gap-1.5 font-medium"
              >
                <Flame className="h-3.5 w-3.5 text-accent" />
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
        <div className="relative overflow-hidden rounded-xl border border-accent/30 bg-surface p-5 sm:p-6 shadow-xs hover:border-accent/40 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left Content */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                <Zap className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-accent" />
                    Recommended Next Action
                  </span>
                  <span
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      badgeVariant === 'danger'
                        ? 'bg-danger/10 text-danger border-danger/30'
                        : badgeVariant === 'warning'
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-accent/10 text-accent border-accent/30',
                    )}
                  >
                    {action.badge}
                  </span>
                  <span className="text-[10px] font-medium text-muted bg-surface-raised border border-border/80 rounded px-1.5 py-0.5">
                    Rule-Based
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {action.title}
                </h3>

                <p className="text-xs text-muted mt-1 leading-relaxed">
                  <span className="font-semibold text-foreground">Why this? </span>
                  {action.reason}
                </p>

                {action.subjectName && (
                  <span className="inline-block mt-2 rounded-md bg-surface-raised border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
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
                className="gap-1.5 font-medium"
              >
                <Timer className="h-3.5 w-3.5" />
                <span>Start Focus</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleViewTask}
                className="gap-1 text-xs font-medium"
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
