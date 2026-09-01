import { useCallback, useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { WelcomeSection } from '../components/dashboard/WelcomeSection'
import { SmartNextActionCard } from '../components/dashboard/SmartNextActionCard'
import { StatsGrid } from '../components/dashboard/StatsGrid'
import { TodaysFocus } from '../components/dashboard/TodaysFocus'
import { UpcomingDeadlinesList } from '../components/dashboard/UpcomingDeadlinesList'
import { ActiveLearningPlans } from '../components/dashboard/ActiveLearningPlans'
import { LearningInsightsPreview } from '../components/dashboard/LearningInsightsPreview'
import { ProductivityChart } from '../components/dashboard/ProductivityChart'
import { LogSessionCard } from '../components/dashboard/LogSessionCard'
import { RecentNotesCard } from '../components/dashboard/RecentNotesCard'
import {
  fetchDashboardData,
  computeTaskStats,
  computeFocusTasks,
  computeWeeklyActivity,
  getWeekMondayLocal,
  getWeekSundayLocal,
} from '../services/dashboardService'
import { getNotes } from '../services/notesService'
import {
  calculateStudyConsistency,
  calculateNeglectedAreas,
  calculateTaskCompletion,
} from '../services/learningAnalyticsService'
import { computeSmartNextAction } from '../services/smartNextActionService'

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

    const [result, notesResult] = await Promise.all([
      fetchDashboardData(user.id),
      getNotes(user.id, { sortBy: 'updated_desc' }),
    ])

    if (result.error) {
      setFetchError(result.error?.message || 'Failed to load dashboard data.')
    } else {
      const stats = computeTaskStats(result.tasks)
      const focusTasks = computeFocusTasks(result.tasks)
      const weeklyActivity = computeWeeklyActivity(result.sessions, weekMon, weekSun)

      setDashData({
        stats,
        focusTasks,
        weeklyActivity,
        deadlines: result.deadlines,
        subjects: result.subjects,
        tasks: result.tasks,
        sessions: result.sessions,
        plans: result.plans,
        milestones: result.milestones,
        notes: notesResult?.data || [],
      })
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    ;(async () => { await loadData() })()
  }, [loadData, sessionRefreshKey])

  async function handleSessionLogged() {
    await loadData()
    setSessionRefreshKey((k) => k + 1)
  }

  // Pure insights calculations for preview card
  const consistency = useMemo(() => {
    return calculateStudyConsistency(dashData?.sessions || [])
  }, [dashData])

  const neglectedAreas = useMemo(() => {
    return calculateNeglectedAreas(dashData?.sessions || [], dashData?.subjects || [])
  }, [dashData])

  const taskCompletion = useMemo(() => {
    return calculateTaskCompletion(dashData?.tasks || [])
  }, [dashData])

  // Deterministic Smart Next Action recommendation
  const smartNextAction = useMemo(() => {
    if (!dashData) return null
    return computeSmartNextAction({
      tasks: dashData.tasks || [],
      deadlines: dashData.deadlines || [],
      subjects: dashData.subjects || [],
      plans: dashData.plans || [],
      milestones: dashData.milestones || [],
      sessions: dashData.sessions || [],
    })
  }, [dashData])

  return (
    <PageContainer width="wide" className="space-y-5 pb-12">
      {/* ─── 1. Welcome Greeting & Personalized Status ───────────── */}
      <WelcomeSection
        loading={loading}
        stats={dashData?.stats ?? null}
        focusTasks={dashData?.focusTasks ?? []}
        deadlines={dashData?.deadlines ?? []}
      />

      {/* ─── 2. Smart Next Action Priority Hero / Get Started Banner ─ */}
      {!loading && (
        <SmartNextActionCard action={smartNextAction} />
      )}

      {/* ─── 3. Key Productivity & Progress Metrics Strip ─────────── */}
      <StatsGrid loading={loading} stats={dashData?.stats ?? null} error={fetchError} />

      {/* ─── 4. Core Daily Workspace Hub (4 Equal-Height Columns) ──── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        <div className="h-full">
          <TodaysFocus
            loading={loading}
            tasks={dashData?.focusTasks ?? []}
            subjects={dashData?.subjects ?? []}
            onTaskToggled={loadData}
          />
        </div>
        <div className="h-full">
          <UpcomingDeadlinesList
            loading={loading}
            deadlines={dashData?.deadlines ?? []}
            subjects={dashData?.subjects ?? []}
          />
        </div>
        <div className="h-full">
          <ActiveLearningPlans
            loading={loading}
            plans={dashData?.plans ?? []}
            milestones={dashData?.milestones ?? []}
            tasks={dashData?.tasks ?? []}
          />
        </div>
        <div className="h-full">
          <LearningInsightsPreview
            loading={loading}
            currentStreak={consistency.currentStreak}
            activeDays7d={consistency.activeDays7d}
            neglectedAreas={neglectedAreas}
            completionRate={taskCompletion.completionRate}
          />
        </div>
      </div>

      {/* ─── 5. Analytics & Action Center (Balanced 2-Col Grid) ────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
        {/* Left Column: Weekly Activity & Goals */}
        <div className="space-y-5">
          <ProductivityChart
            loading={loading}
            weeklyActivity={dashData?.weeklyActivity ?? null}
          />
        </div>

        {/* Right Column: Recent Notes Knowledge Preview & External Logger */}
        <div className="space-y-5">
          <RecentNotesCard
            loading={loading}
            notes={dashData?.notes ?? []}
            subjects={dashData?.subjects ?? []}
          />
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
