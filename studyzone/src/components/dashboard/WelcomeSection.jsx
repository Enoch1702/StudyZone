import { motion } from 'motion/react'
import { useAuth } from '../../context/useAuth'
import { getGreeting } from '../../lib/utils'
import { fadeUp } from '../../lib/motion'
import { getPersonalizedGreeting } from '../../lib/learnerProfile'

/**
 * @param {{ loading: boolean, stats: object|null, focusTasks: Array, deadlines: Array }} props
 */
export function WelcomeSection({ loading, stats, focusTasks, deadlines }) {
  const { profile, user } = useAuth()
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const greeting = getGreeting()
  const personalizedMessage = getPersonalizedGreeting(
    profile?.learner_type,
    profile?.primary_goal,
    profile?.learning_focus,
  )

  // Count incomplete focus tasks
  const tasksDueToday = focusTasks.filter((t) => t.status !== 'completed').length

  // Count deadlines within next 7 days
  const now = new Date()
  const sevenDaysLater = new Date(now)
  sevenDaysLater.setDate(now.getDate() + 7)
  const deadlinesThisWeek = deadlines.filter((d) => {
    const due = new Date(d.due_date)
    return due >= now && due <= sevenDaysLater
  }).length

  const overallProgress = stats?.overallProgress ?? 0

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-5 py-5 transition-all duration-200 hover:border-border/80 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted tracking-wide">{greeting}</p>
        </div>
        <h2 className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {displayName}
        </h2>
        <p className="mt-1.5 text-xs text-accent font-medium tracking-wide">
          {personalizedMessage}
        </p>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted">
          {loading ? (
            <span className="inline-block h-3.5 w-48 animate-pulse rounded bg-surface-raised" />
          ) : (
            <>
              <span className="font-semibold text-foreground">{tasksDueToday}</span> task{tasksDueToday !== 1 ? 's' : ''} remaining today
              {' · '}
              <span className="font-semibold text-foreground">{deadlinesThisWeek}</span> deadline{deadlinesThisWeek !== 1 ? 's' : ''} on your radar this week.
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 gap-6 border-t border-border-subtle pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
        <div className="rounded-lg bg-surface-raised/40 px-3 py-2 border border-border/40 min-w-[70px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
            {loading ? '—' : tasksDueToday}
          </p>
          <p className="text-[11px] text-muted">open tasks</p>
        </div>
        <div className="rounded-lg bg-surface-raised/40 px-3 py-2 border border-border/40 min-w-[70px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Progress</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
            {loading ? '—' : `${overallProgress}%`}
          </p>
          <p className="text-[11px] text-muted">overall</p>
        </div>
      </div>
    </motion.section>
  )
}
