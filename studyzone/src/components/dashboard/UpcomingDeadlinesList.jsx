import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
import { DeadlineUrgency } from '../ui/DeadlineUrgency'
import { EmptyState } from '../ui/EmptyState'
import { formatDate } from '../../lib/utils'
import { staggerContainer, staggerItem } from '../../lib/motion'

/**
 * @param {{ loading: boolean, deadlines: Array, subjects: Array }} props
 * deadlines use real schema fields (id, title, due_date, deadline_type, subject_id)
 */
export function UpcomingDeadlinesList({ loading, deadlines, subjects }) {
  function subjectName(subjectId) {
    if (!subjectId) return ''
    const match = subjects.find((s) => s.id === subjectId)
    return match ? match.name : ''
  }

  // Show only upcoming deadlines (due_date >= now)
  const now = new Date()
  const upcoming = deadlines.filter((d) => new Date(d.due_date) >= now)

  return (
    <Card className="flex h-full flex-col p-0">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5 flex items-center justify-between">
        <SectionHeader
          title="Upcoming Deadlines"
          description={
            loading
              ? 'Loading…'
              : `${upcoming.length} upcoming deadline${upcoming.length === 1 ? '' : 's'}`
          }
        />
        <Link
          to="/deadlines"
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View all</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex-1 p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-raised/40" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming deadlines"
            description="Deadlines and target dates you add will appear here so you never miss an important milestone."
          />
        ) : (
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {upcoming.map((deadline) => (
              <motion.li
                key={deadline.id}
                variants={staggerItem}
                className="rounded-lg border border-border-subtle bg-surface-raised/40 px-3 py-3 transition-all duration-200 hover:border-border hover:bg-surface-raised/70 hover:shadow-xs sm:px-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {deadline.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {subjectName(deadline.subject_id) || (
                        <span className="italic text-muted-foreground/60">No subject</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(deadline.due_date)}
                    </span>
                    {/* Urgency is calculated dynamically from the current date */}
                    <DeadlineUrgency date={deadline.due_date} />
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </Card>
  )
}
