import { motion } from 'motion/react'
import { BookOpen, PieChart } from 'lucide-react'
import { formatMinutes } from '../../services/learningAnalyticsService'
import { staggerContainer, staggerItem } from '../../lib/motion'

/**
 * Learning Balance Component.
 * Displays real study time distribution across learning areas over the last 30 days.
 *
 * @param {Object} props
 * @param {Array} props.items - [{ subjectId, subjectName, color, totalMinutes, percentageOfStudyTime }]
 * @param {number} props.totalMinutes - Total study minutes in last 30 days
 */
export function LearningBalance({ items = [], totalMinutes = 0 }) {
  const hasData = items && items.length > 0 && totalMinutes > 0

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/20">
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Learning Area Balance
              </h3>
            </div>
          </div>

          {hasData && (
            <span className="text-xs font-semibold text-muted tabular-nums">
              Total {formatMinutes(totalMinutes)} (30d)
            </span>
          )}
        </div>

        {/* Content */}
        {!hasData ? (
          /* Empty State */
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised border border-border text-muted mb-2.5">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No recent study sessions</p>
            <p className="mt-1 text-[11px] text-muted max-w-xs leading-relaxed">
              Log focus sessions with your subjects to track study time distribution across your learning areas.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Multi-segment Combined Progress Bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-raised flex border border-border/50">
              {items.map((item, idx) => (
                <div
                  key={item.subjectId || `item-${idx}`}
                  style={{
                    width: `${item.percentageOfStudyTime}%`,
                    backgroundColor: item.color,
                  }}
                  className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                  title={`${item.subjectName}: ${formatMinutes(item.totalMinutes)} (${item.percentageOfStudyTime}%)`}
                />
              ))}
            </div>

            {/* List of Breakdown Items */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-2.5 pt-1"
            >
              {items.map((item, idx) => (
                <motion.div
                  key={item.subjectId || `sub-${idx}`}
                  variants={staggerItem}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface-raised/40 p-2.5 sm:p-3 transition-colors hover:border-border"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-xs font-medium text-foreground">
                      {item.subjectName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {formatMinutes(item.totalMinutes)}
                    </span>
                    <span className="inline-block min-w-[36px] text-right text-[11px] font-bold text-muted tabular-nums">
                      {item.percentageOfStudyTime}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {hasData && (
        <p className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted">
          Showing distribution of study time across active subjects over the last 30 days.
        </p>
      )}
    </div>
  )
}
