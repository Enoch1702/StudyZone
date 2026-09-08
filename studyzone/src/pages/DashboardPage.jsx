import { useCallback, useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { WelcomeSection } from '../components/dashboard/WelcomeSection'
import { SmartNextActionCard } from '../components/dashboard/SmartNextActionCard'
import { GettingStartedCard } from '../components/dashboard/GettingStartedCard'
import { StatsGrid } from '../components/dashboard/StatsGrid'
import { TodaysFocus } from '../components/dashboard/TodaysFocus'
import { UpcomingDeadlinesList } from '../components/dashboard/UpcomingDeadlinesList'
import { ActiveLearningPlans } from '../components/dashboard/ActiveLearningPlans'
import { LogSessionCard } from '../components/dashboard/LogSessionCard'
import { RecentNotesCard } from '../components/dashboard/RecentNotesCard'
import {
  fetchDashboardData,
  computeTaskStats,
  computeFocusTasks,
} from '../services/dashboardService'
import { getNotes } from '../services/notesService'
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

    const [result, notesResult] = await Promise.all([
      fetchDashboardData(user.id),
      getNotes(user.id, { sortBy: 'updated_desc' }),
    ])

    if (result.error) {
      setFetchError(result.error?.message || 'Failed to load dashboard data.')
    } else {
      const stats = computeTaskStats(result.tasks)
      const focusTasks = computeFocusTasks(result.tasks)

      setDashData({
        stats,
        focusTasks,
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

  const hasActivePlans = useMemo(() => {
    return (dashData?.plans || []).some((p) => p.status === 'active')
  }, [dashData])

  return (
    <PageContainer width="wide" className="space-y-5 pb-12">
      {/* ─── 1. Welcome Greeting & Status ───────────── */}
      <WelcomeSection
        loading={loading}
        stats={dashData?.stats ?? null}
        focusTasks={dashData?.focusTasks ?? []}
        deadlines={dashData?.deadlines ?? []}
      />

      {/* ─── 2. Getting Started Guide (Dismissible) ─────── */}
      <GettingStartedCard />

      {/* ─── 3. Deterministic Recommended Next Action ─── */}
      {!loading && (
        <SmartNextActionCard action={smartNextAction} />
      )}

      {/* ─── 4. Quick Metrics Strip ───────────────────── */}
      <StatsGrid loading={loading} stats={dashData?.stats ?? null} error={fetchError} />

      {/* ─── 5. Actionable Learning Workspace Hub ──────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
        {/* Left Column: Immediate Action Focus */}
        <div className="space-y-5">
          <TodaysFocus
            loading={loading}
            tasks={dashData?.focusTasks ?? []}
            subjects={dashData?.subjects ?? []}
            onTaskToggled={loadData}
          />

          <RecentNotesCard
            loading={loading}
            notes={dashData?.notes ?? []}
            subjects={dashData?.subjects ?? []}
          />
        </div>

        {/* Right Column: Deadlines, Sessions & Roadmaps */}
        <div className="space-y-5">
          <UpcomingDeadlinesList
            loading={loading}
            deadlines={dashData?.deadlines ?? []}
            subjects={dashData?.subjects ?? []}
          />

          <LogSessionCard
            subjects={dashData?.subjects ?? []}
            tasks={(dashData?.tasks ?? []).filter((t) => t.status !== 'completed')}
            onSessionLogged={handleSessionLogged}
          />

          {hasActivePlans && (
            <ActiveLearningPlans
              loading={loading}
              plans={dashData?.plans ?? []}
              milestones={dashData?.milestones ?? []}
              tasks={dashData?.tasks ?? []}
            />
          )}
        </div>
      </div>
    </PageContainer>
  )
}
