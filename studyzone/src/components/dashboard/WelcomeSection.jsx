import { useAuth } from '../../context/useAuth'
import { getGreeting } from '../../lib/utils'

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
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="text-xs font-medium text-muted">{greeting}</p>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {displayName}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          {loading ? (
            <span className="inline-block h-4 w-48 animate-pulse rounded bg-surface-raised" />
          ) : (
            <>
              {tasksDueToday} task{tasksDueToday !== 1 ? 's' : ''} remaining today
              {' · '}
              {deadlinesThisWeek} deadline{deadlinesThisWeek !== 1 ? 's' : ''} on your radar this week.
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 gap-6 border-t border-border-subtle pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Today</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {loading ? '—' : tasksDueToday}
          </p>
          <p className="text-xs text-muted">open tasks</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Progress</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {loading ? '—' : `${overallProgress}%`}
          </p>
          <p className="text-xs text-muted">semester</p>
        </div>
      </div>
    </section>
  )
}
