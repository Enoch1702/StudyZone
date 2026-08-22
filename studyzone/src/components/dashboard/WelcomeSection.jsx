import { useAuth } from '../../context/useAuth'
import { dashboardStats, todaysFocusTasks, upcomingDeadlines } from '../../data/mockData'
import { getGreeting } from '../../lib/utils'

export function WelcomeSection() {
  const { profile, user } = useAuth()
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const greeting = getGreeting()
  const tasksDueToday = todaysFocusTasks.filter((t) => !t.completed).length
  const deadlinesThisWeek = upcomingDeadlines.length

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="text-xs font-medium text-muted">{greeting}</p>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {displayName}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          {tasksDueToday} task{tasksDueToday !== 1 ? 's' : ''} remaining today
          {' · '}
          {deadlinesThisWeek} deadline{deadlinesThisWeek !== 1 ? 's' : ''} on your radar this week.
        </p>
      </div>

      <div className="flex shrink-0 gap-6 border-t border-border-subtle pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Today</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {tasksDueToday}
          </p>
          <p className="text-xs text-muted">open tasks</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Progress</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {dashboardStats.overallProgress}%
          </p>
          <p className="text-xs text-muted">semester</p>
        </div>
      </div>
    </section>
  )
}
