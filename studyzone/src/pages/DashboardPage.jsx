import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { WelcomeSection } from '../components/dashboard/WelcomeSection'
import { StatsGrid } from '../components/dashboard/StatsGrid'
import { TodaysFocus } from '../components/dashboard/TodaysFocus'
import { UpcomingDeadlinesList } from '../components/dashboard/UpcomingDeadlinesList'
import { ProductivityChart } from '../components/dashboard/ProductivityChart'
import { LogSessionCard } from '../components/dashboard/LogSessionCard'
import {
  fetchDashboardData,
  computeTaskStats,
  computeFocusTasks,
  computeWeeklyActivity,
  getWeekMondayLocal,
  getWeekSundayLocal,
} from '../services/dashboardService'

export default function DashboardPage() {
  const { user } = useAuth()

  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0)

  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setFetchError(null)

    const weekMon = getWeekMondayLocal()
    const weekSun = getWeekSundayLocal(weekMon)

    const result = await fetchDashboardData(
      user.id,
      weekMon.toISOString(),
      weekSun.toISOString(),
    )

    if (result.error) {
      setFetchError(result.error?.message || 'Failed to load dashboard data.')
    } else {
      const stats = computeTaskStats(result.tasks)
      const focusTasks = computeFocusTasks(result.tasks)
      const weeklyActivity = computeWeeklyActivity(result.sessions)

      setDashData({
        stats,
        focusTasks,
        weeklyActivity,
        deadlines: result.deadlines,
        subjects: result.subjects,
        tasks: result.tasks,
      })
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    ;(async () => { await loadData() })()
  }, [loadData, sessionRefreshKey])

  /** Called by LogSessionCard after a session is saved to refresh the chart */
  function handleSessionLogged() {
    setSessionRefreshKey((k) => k + 1)
  }

  return (
    <PageContainer width="wide" className="space-y-5">
      <WelcomeSection
        loading={loading}
        stats={dashData?.stats ?? null}
        focusTasks={dashData?.focusTasks ?? []}
        deadlines={dashData?.deadlines ?? []}
      />

      <StatsGrid loading={loading} stats={dashData?.stats ?? null} error={fetchError} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TodaysFocus
          loading={loading}
          tasks={dashData?.focusTasks ?? []}
          subjects={dashData?.subjects ?? []}
          onTaskToggled={loadData}
        />
        <UpcomingDeadlinesList
          loading={loading}
          deadlines={dashData?.deadlines ?? []}
          subjects={dashData?.subjects ?? []}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProductivityChart
            loading={loading}
            weeklyActivity={dashData?.weeklyActivity ?? null}
          />
        </div>
        <div className="lg:col-span-2">
          <LogSessionCard
            subjects={dashData?.subjects ?? []}
            tasks={(dashData?.tasks ?? []).filter((t) => t.status !== 'completed')}
            onSessionLogged={handleSessionLogged}
          />
        </div>
      </div>
    </PageContainer>
  )
}
