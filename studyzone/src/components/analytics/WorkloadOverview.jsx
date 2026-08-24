import { AlertTriangle, CalendarClock, CheckCircle, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Upcoming Workload Overview Component.
 * Analyzes tasks, deadlines, and urgency for the next 7 calendar days.
 *
 * @param {Object} props
 * @param {number} props.upcomingTasksCount - Pending tasks due in next 7d
 * @param {number} props.upcomingDeadlinesCount - Deadlines in next 7d
 * @param {number} props.highPriorityCount - High/urgent items
 * @param {number} props.overdueCount - Overdue incomplete tasks
 * @param {string|null} props.busiestDayLabel - Name of busiest day (e.g. "Thursday" or "Today")
 * @param {number} props.busiestItemCount - Number of items on busiest day
 * @param {Array} props.dailyWorkload - 7-day array of daily item counts
 */
export function WorkloadOverview({
  upcomingTasksCount = 0,
  upcomingDeadlinesCount = 0,
  highPriorityCount = 0,
  overdueCount = 0,
  busiestDayLabel = null,
  busiestItemCount = 0,
  dailyWorkload = [],
}) {
  const totalUpcoming = upcomingTasksCount + upcomingDeadlinesCount + overdueCount
  const hasWorkload = totalUpcoming > 0

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/20">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Upcoming Workload (Next 7 Days)
              </h3>
            </div>
          </div>

          {busiestDayLabel && busiestItemCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning border border-warning/30">
              <Clock className="h-3 w-3" />
              Busiest: {busiestDayLabel} ({busiestItemCount})
            </span>
          )}
        </div>

        {/* Content */}
        {!hasWorkload ? (
          /* Empty State */
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised border border-border text-muted mb-2.5">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <p className="text-xs font-semibold text-foreground">Clear schedule ahead</p>
            <p className="mt-1 text-[11px] text-muted max-w-xs leading-relaxed">
              You have no upcoming tasks or deadlines scheduled for the next 7 days.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* 4 Metric Tiles Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {/* Upcoming Tasks */}
              <div className="rounded-xl border border-border/60 bg-surface-raised/40 p-3 text-center">
                <span className="block text-[10px] font-medium text-muted uppercase tracking-wider">
                  Tasks Due
                </span>
                <span className="mt-1 block text-xl font-bold text-foreground tabular-nums">
                  {upcomingTasksCount}
                </span>
              </div>

              {/* Deadlines */}
              <div className="rounded-xl border border-border/60 bg-surface-raised/40 p-3 text-center">
                <span className="block text-[10px] font-medium text-muted uppercase tracking-wider">
                  Deadlines
                </span>
                <span className="mt-1 block text-xl font-bold text-accent tabular-nums">
                  {upcomingDeadlinesCount}
                </span>
              </div>

              {/* High Priority */}
              <div className="rounded-xl border border-border/60 bg-surface-raised/40 p-3 text-center">
                <span className="block text-[10px] font-medium text-muted uppercase tracking-wider">
                  High Priority
                </span>
                <span className="mt-1 block text-xl font-bold text-warning tabular-nums">
                  {highPriorityCount}
                </span>
              </div>

              {/* Overdue */}
              <div
                className={cn(
                  'rounded-xl border p-3 text-center',
                  overdueCount > 0
                    ? 'border-danger/40 bg-danger/10 text-danger'
                    : 'border-border/60 bg-surface-raised/40',
                )}
              >
                <span className="block text-[10px] font-medium uppercase tracking-wider opacity-80">
                  Overdue
                </span>
                <span className="mt-1 block text-xl font-bold tabular-nums">
                  {overdueCount}
                </span>
              </div>
            </div>

            {/* Daily Mini-Bar Breakdown */}
            {dailyWorkload.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-surface-raised/30 p-3">
                <span className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">
                  Daily Load (Next 7 Days)
                </span>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {dailyWorkload.map((day) => {
                    const maxCount = Math.max(1, ...dailyWorkload.map((d) => d.itemCount))
                    const barHeightPercent = day.itemCount > 0 ? Math.max(20, Math.round((day.itemCount / maxCount) * 100)) : 8

                    return (
                      <div key={day.dateStr} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium text-muted">
                          {day.dayLabel}
                        </span>

                        <div className="h-14 w-full flex items-end justify-center rounded bg-surface p-0.5 border border-border/30">
                          <div
                            style={{ height: `${barHeightPercent}%` }}
                            className={cn(
                              'w-full rounded-sm transition-all duration-300',
                              day.itemCount > 0
                                ? day.isToday
                                  ? 'bg-accent'
                                  : 'bg-accent/70'
                                : 'bg-surface-raised',
                            )}
                          />
                        </div>

                        <span
                          className={cn(
                            'text-[10px] font-bold tabular-nums',
                            day.itemCount > 0 ? 'text-foreground' : 'text-muted-foreground/50',
                          )}
                        >
                          {day.itemCount}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Overdue alert if applicable */}
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  You have <strong>{overdueCount} overdue item{overdueCount !== 1 ? 's' : ''}</strong> requiring attention.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {hasWorkload && (
        <p className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted">
          Aggregates pending tasks and deadlines scheduled between today and the next 7 days.
        </p>
      )}
    </div>
  )
}
