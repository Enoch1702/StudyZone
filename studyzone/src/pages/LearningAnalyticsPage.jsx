import { useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { StatCard } from '../components/ui/StatCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { AIInsightsCard } from '../components/analytics/AIInsightsCard'
import { ConsistencyCalendar } from '../components/analytics/ConsistencyCalendar'
import { LearningBalance } from '../components/analytics/LearningBalance'
import { TaskCompletionInsights } from '../components/analytics/TaskCompletionInsights'
import { WorkloadOverview } from '../components/analytics/WorkloadOverview'
import { NeglectedAreas } from '../components/analytics/NeglectedAreas'
import {
  fetchLearningAnalyticsData,
  calculateStudyConsistency,
  calculateStudyTimeStats,
  calculateLearningBalance,
  calculateNeglectedAreas,
  calculateTaskCompletion,
  calculateUpcomingWorkload,
  classifyWorkload,
  buildAnalyticsSummary,
  formatMinutes,
} from '../services/learningAnalyticsService'
import { getLearningPlans } from '../services/learningPlansService'
import { fadeUp, staggerContainer, staggerItem } from '../lib/motion'

export default function LearningAnalyticsPage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [analyticsRaw, setAnalyticsRaw] = useState({
    sessions: [],
    tasks: [],
    deadlines: [],
    subjects: [],
    plans: [],
  })

  // Load analytics data and learning plans in parallel
  useEffect(() => {
    let ignore = false

    async function loadData() {
      if (!user?.id) return
      setLoading(true)
      setError('')

      try {
        const [result, plansRes] = await Promise.all([
          fetchLearningAnalyticsData(user.id),
          getLearningPlans(user.id),
        ])

        if (ignore) return

        if (result.error) {
          setError(result.error.message || 'Failed to load learning analytics.')
        } else {
          setAnalyticsRaw({
            sessions: result.sessions || [],
            tasks: result.tasks || [],
            deadlines: result.deadlines || [],
            subjects: result.subjects || [],
            plans: plansRes?.data || [],
          })
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'An error occurred while loading analytics.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [user?.id, reloadKey])

  // Pure deterministic calculations
  const consistency = useMemo(() => {
    return calculateStudyConsistency(analyticsRaw.sessions)
  }, [analyticsRaw.sessions])

  const timeStats = useMemo(() => {
    return calculateStudyTimeStats(analyticsRaw.sessions)
  }, [analyticsRaw.sessions])

  const learningBalance = useMemo(() => {
    return calculateLearningBalance(analyticsRaw.sessions, analyticsRaw.subjects)
  }, [analyticsRaw.sessions, analyticsRaw.subjects])

  const neglectedAreas = useMemo(() => {
    return calculateNeglectedAreas(analyticsRaw.sessions, analyticsRaw.subjects)
  }, [analyticsRaw.sessions, analyticsRaw.subjects])

  const taskCompletion = useMemo(() => {
    return calculateTaskCompletion(analyticsRaw.tasks)
  }, [analyticsRaw.tasks])

  const upcomingWorkload = useMemo(() => {
    return calculateUpcomingWorkload(analyticsRaw.tasks, analyticsRaw.deadlines)
  }, [analyticsRaw.tasks, analyticsRaw.deadlines])

  const workloadClassification = useMemo(() => {
    return classifyWorkload(upcomingWorkload)
  }, [upcomingWorkload])

  // Normalized analytics summary payload for AI Coach
  const analyticsSummary = useMemo(() => {
    return buildAnalyticsSummary({
      consistency,
      timeStats,
      learningBalance,
      neglectedAreas,
      taskCompletion,
      upcomingWorkload,
      workloadClassification,
    })
  }, [
    consistency,
    timeStats,
    learningBalance,
    neglectedAreas,
    taskCompletion,
    upcomingWorkload,
    workloadClassification,
  ])

  return (
    <PageContainer width="wide" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/8">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Learning Insights
            </h1>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              Understand your study habits, consistency, progress, and workload.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={loading}
          className="gap-1.5 self-start text-xs sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs text-muted">Calculating deterministic learning analytics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Hero StatCards Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          >
            <motion.div variants={staggerItem}>
              <StatCard
                label="Study Streak"
                value={consistency.currentStreak}
                detail={
                  consistency.longestStreak > 0
                    ? `Best: ${consistency.longestStreak} days`
                    : 'Log today to start'
                }
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <StatCard
                label="Active Days (7d)"
                value={`${consistency.activeDays7d} / 7`}
                detail={`${consistency.activeDays30d} days in last 30d`}
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <StatCard
                label="Study Time (7d)"
                value={formatMinutes(timeStats.totalMinutes7d)}
                detail={
                  timeStats.averageMinutesPerActiveDay7d > 0
                    ? `Avg ${formatMinutes(timeStats.averageMinutesPerActiveDay7d)}/active day`
                    : '0 active days'
                }
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <StatCard
                label="Task Completion"
                value={`${taskCompletion.completionRate}%`}
                detail={`${taskCompletion.tasksCompleted} of ${Math.max(taskCompletion.tasksCreated, taskCompletion.tasksCompleted)} (30d)`}
                progress={taskCompletion.completionRate}
              />
            </motion.div>
          </motion.div>

          {/* Phase 8B: AI Learning Coach Launchpad */}
          <section aria-label="AI Learning Coach">
            <AIInsightsCard analyticsSummary={analyticsSummary} />
          </section>

          {/* Section 1: 7-Day Consistency Calendar */}
          <motion.section variants={fadeUp} initial="hidden" animate="visible">
            <ConsistencyCalendar
              calendar={consistency.sevenDayCalendar}
              currentStreak={consistency.currentStreak}
              longestStreak={consistency.longestStreak}
              activeDays7d={consistency.activeDays7d}
            />
          </motion.section>

          {/* Section 2: Learning Balance & Task Execution (2 Columns) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex">
              <div className="w-full">
                <LearningBalance
                  items={learningBalance.items}
                  totalMinutes={learningBalance.totalStudyMinutes30d}
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex">
              <div className="w-full">
                <TaskCompletionInsights
                  completionRate={taskCompletion.completionRate}
                  tasksCompleted={taskCompletion.tasksCompleted}
                  tasksCreated={taskCompletion.tasksCreated}
                  interpretation={taskCompletion.interpretation}
                />
              </div>
            </motion.div>
          </div>

          {/* Section 3: Upcoming Workload & Attention (2 Columns) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex">
              <div className="w-full">
                <WorkloadOverview {...upcomingWorkload} />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex">
              <div className="w-full">
                <NeglectedAreas
                  items={neglectedAreas}
                  totalSubjects={analyticsRaw.subjects.length}
                />
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
