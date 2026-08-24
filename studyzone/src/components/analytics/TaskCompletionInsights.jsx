import { motion } from 'motion/react'
import { CheckCircle2, CheckSquare } from 'lucide-react'

/**
 * Task Completion Insights Component.
 * Displays deterministic 30-day task execution metrics and completion rate.
 *
 * @param {Object} props
 * @param {number} props.completionRate - Percentage 0-100
 * @param {number} props.tasksCompleted - Tasks completed in last 30d
 * @param {number} props.tasksCreated - Tasks created in last 30d
 * @param {string} props.interpretation - Deterministic explanation
 */
export function TaskCompletionInsights({
  completionRate = 0,
  tasksCompleted = 0,
  tasksCreated = 0,
  interpretation = '',
}) {
  const totalTracked = Math.max(tasksCreated, tasksCompleted)
  const hasTasks = totalTracked > 0

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/20">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Task Completion Insights
              </h3>
            </div>
          </div>

          <span className="text-xs font-semibold text-muted">Last 30 Days</span>
        </div>

        {/* Content */}
        {!hasTasks ? (
          /* Empty State */
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised border border-border text-muted mb-2.5">
              <CheckSquare className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No tasks in this period</p>
            <p className="mt-1 text-[11px] text-muted max-w-xs leading-relaxed">
              Add tasks and mark them completed as you study to build your execution insights.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-surface-raised/40 p-3 text-center">
                <span className="block text-[11px] font-medium text-muted uppercase tracking-wider">
                  Completion Rate
                </span>
                <span className="mt-1 block text-2xl font-bold text-foreground tabular-nums">
                  {completionRate}%
                </span>
              </div>

              <div className="rounded-xl border border-border/60 bg-surface-raised/40 p-3 text-center">
                <span className="block text-[11px] font-medium text-muted uppercase tracking-wider">
                  Completed
                </span>
                <span className="mt-1 block text-2xl font-bold text-accent tabular-nums">
                  {tasksCompleted} <span className="text-xs font-normal text-muted">/ {totalTracked}</span>
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Execution Rate</span>
                <span className="font-semibold text-foreground">{completionRate}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-raised border border-border/40">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Deterministic Interpretation Card */}
            <div className="flex items-start gap-2.5 rounded-xl border border-accent/20 bg-accent/8 p-3 text-xs text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[12px]">{interpretation}</p>
            </div>
          </div>
        )}
      </div>

      {hasTasks && (
        <p className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted">
          Based on non-archived tasks created and finished during the last 30 calendar days.
        </p>
      )}
    </div>
  )
}
