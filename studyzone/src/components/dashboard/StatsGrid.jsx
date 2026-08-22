import { StatCard } from '../ui/StatCard'

/**
 * @param {{ loading: boolean, stats: object|null, error: string|null }} props
 */
export function StatsGrid({ loading, stats, error }) {
  if (error) {
    return (
      <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
        Failed to load statistics. {error}
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface px-4 py-3.5 sm:px-5 sm:py-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-surface-raised" />
            <div className="mt-3 h-7 w-12 animate-pulse rounded bg-surface-raised" />
          </div>
        ))}
      </div>
    )
  }

  const completionRate =
    stats.totalTasks === 0 ? 0 : Math.round((stats.completedTasks / stats.totalTasks) * 100)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatCard label="Total tasks" value={stats.totalTasks} detail="all subjects" />
      <StatCard
        label="Completed"
        value={stats.completedTasks}
        detail={`${completionRate}% done`}
      />
      <StatCard label="Upcoming" value={stats.upcomingCount} detail="next 7 days" />
      <StatCard
        label="Overall progress"
        value={`${stats.overallProgress}%`}
        progress={stats.overallProgress}
      />
    </div>
  )
}
