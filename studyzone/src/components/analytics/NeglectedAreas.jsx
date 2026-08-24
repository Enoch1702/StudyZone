import { motion } from 'motion/react'
import { AlertCircle, BookOpen, CheckCircle, Clock } from 'lucide-react'
import { staggerContainer, staggerItem } from '../../lib/motion'

/**
 * Neglected Learning Areas Component.
 * Surfaces subjects that have not had a study session in >14 days or have never been studied.
 *
 * @param {Object} props
 * @param {Array} props.items - [{ subjectId, subjectName, color, daysSinceLastStudy, lastStudiedDate }]
 * @param {number} props.totalSubjects - Total number of subjects created by user
 */
export function NeglectedAreas({ items = [], totalSubjects = 0 }) {
  if (totalSubjects === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-border/70">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised text-muted border border-border">
            <AlertCircle className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Needs Attention
          </h3>
        </div>
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised border border-border text-muted mb-2">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">No subjects added yet</p>
          <p className="mt-1 text-[11px] text-muted max-w-xs leading-relaxed">
            Add your subjects to monitor whether any learning areas are falling behind.
          </p>
        </div>
      </div>
    )
  }

  const hasNeglected = items && items.length > 0

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning border border-warning/20">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Needs Attention
            </h3>
          </div>
        </div>

        <span className="text-[11px] font-medium text-muted">
          {hasNeglected ? `${items.length} learning area${items.length !== 1 ? 's' : ''}` : 'All active'}
        </span>
      </div>

      {/* Content */}
      {!hasNeglected ? (
        /* All areas active */
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 border border-success/20 text-success mb-2">
            <CheckCircle className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">All subjects are active</p>
          <p className="mt-1 text-[11px] text-muted max-w-xs leading-relaxed">
            Great job! You have logged study sessions for all of your subjects in the last 14 days.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          <p className="text-xs text-muted">
            These subjects have not had any logged focus sessions in over 14 days:
          </p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2 pt-1"
          >
            {items.map((item) => (
              <motion.div
                key={item.subjectId}
                variants={staggerItem}
                className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-xs font-semibold text-foreground">
                    {item.subjectName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.daysSinceLastStudy === null ? (
                    <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-muted border border-border/80">
                      Never studied
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning border border-warning/30">
                      <Clock className="h-2.5 w-2.5" />
                      {item.daysSinceLastStudy} days ago
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}
