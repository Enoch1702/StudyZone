import { StatCard } from '../ui/StatCard'
import { dashboardStats } from '../../data/mockData'

export function StatsGrid() {
  const completionRate = Math.round(
    (dashboardStats.completed / dashboardStats.totalTasks) * 100,
  )

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatCard
        label="Total tasks"
        value={dashboardStats.totalTasks}
        detail="all subjects"
      />
      <StatCard
        label="Completed"
        value={dashboardStats.completed}
        detail={`${completionRate}% done`}
      />
      <StatCard
        label="Upcoming"
        value={dashboardStats.upcoming}
        detail="next 7 days"
      />
      <StatCard
        label="Overall progress"
        value={`${dashboardStats.overallProgress}%`}
        progress={dashboardStats.overallProgress}
      />
    </div>
  )
}
