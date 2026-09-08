import { useCallback, useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { WelcomeSection } from '../components/dashboard/WelcomeSection'
import { GettingStartedCard } from '../components/dashboard/GettingStartedCard'
import { SmartNextActionCard } from '../components/dashboard/SmartNextActionCard'
import { TodaysFocus } from '../components/dashboard/TodaysFocus'
import { QuickFocusCard } from '../components/dashboard/QuickFocusCard'
import { RecentNotesCard } from '../components/dashboard/RecentNotesCard'
import { WeeklySummaryStrip } from '../components/dashboard/WeeklySummaryStrip'
import {
  fetchDashboardData,
  computeFocusTasks,
} from '../services/dashboardService'
import { getNotes } from '../services/notesService'
import { computeSmartNextAction } from '../services/smartNextActionService'

/**
 * Dashboard Page — The Daily Action Hub.
 *
 * Core Question Answered: "What should I do now?"
 *
 * Contains EXACTLY six primary functional sections:
 *   1. Welcome Section (simple greeting, no role badge, no unnecessary statistics)
 *   2. Smart Next Action (deterministic, explainable recommendation with "Why this?")
 *   3. Today's Focus (concise preview of tasks scheduled/due today with 1-click completion)
 *   4. Quick Focus (immediate 1-click launcher for 25:00 distraction-free session)
 *   5. Recent Notes (fast access to recently edited study notes)
 *   6. Weekly Summary Strip (compact 1-line overview: Study Time, Active Days, Tasks Completed)
 *
 * Strictly NO duplicate analytics, NO Total Tasks / Completed / Upcoming / Progress cards,
 * NO Productivity Chart, NO Upcoming Deadlines card, NO Active Learning Plans card.
 */
export default function DashboardPage() {
  const { user } = useAuth()

  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

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
      const focusTasks = computeFocusTasks(result.tasks)

      setDashData({
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
    ;(async () => {
      await loadData()
    })()
  }, [loadData])

  // Deterministic Smart Next Action recommendation (Transparent Rule-Based Heuristic)
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
    <PageContainer width="wide" className="space-y-6 pb-12">
      {/* ─── 1. Welcome Section ─────────────────────────────── */}
      <WelcomeSection />

      {/* ─── Dismissible Getting Started Guide (First-Time Only) ─── */}
      <GettingStartedCard />

      {/* Error Alert if data fetch failed */}
      {fetchError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger">
          {fetchError}
        </div>
      )}

      {/* ─── 2. Smart Next Action (Deterministic Heuristic) ─── */}
      {!loading && (
        <SmartNextActionCard action={smartNextAction} />
      )}

      {/* ─── Actionable Learning Workspace Hub (Sections 3, 4, 5) ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        {/* Left Column: Immediate Task Action & Notes */}
        <div className="space-y-6">
          {/* ─── 3. Today's Focus ─────────────────────────────── */}
          <TodaysFocus
            loading={loading}
            tasks={dashData?.focusTasks ?? []}
            subjects={dashData?.subjects ?? []}
            onTaskToggled={loadData}
          />

          {/* ─── 5. Recent Notes ──────────────────────────────── */}
          <RecentNotesCard
            loading={loading}
            notes={dashData?.notes ?? []}
            subjects={dashData?.subjects ?? []}
          />
        </div>

        {/* Right Column: Quick Focus Timer Launcher */}
        <div className="space-y-6">
          {/* ─── 4. Quick Focus ───────────────────────────────── */}
          <QuickFocusCard />
        </div>
      </div>

      {/* ─── 6. Weekly Summary Strip ────────────────────────── */}
      <WeeklySummaryStrip
        loading={loading}
        sessions={dashData?.sessions ?? []}
        tasks={dashData?.tasks ?? []}
      />
    </PageContainer>
  )
}
