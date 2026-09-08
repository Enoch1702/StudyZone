import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, CalendarDays, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { Card } from '../ui/Card'
import { formatMinutes } from '../../services/learningAnalyticsService'
import { getWeekMondayLocal, getWeekSundayLocal } from '../../services/dashboardService'
import { fadeUp } from '../../lib/motion'

/**
 * Compact Weekly Summary Strip for the Dashboard.
 * Answers "How is my week going?" concisely:
 *   - Study Time (e.g. 4h 20m)
 *   - Active Days (e.g. 4)
 *   - Tasks Completed (e.g. 6)
 *   - [ View Learning Insights → ]
 *
 * Strictly NO charts, NO analytics cards, NO Overall Progress percentage, NO Productivity Chart.
 */
export function WeeklySummaryStrip({ loading, sessions = [], tasks = [] }) {
  const summary = useMemo(() => {
    const weekMon = getWeekMondayLocal()
    const weekSun = getWeekSundayLocal(weekMon)

    // 1. Total study minutes this week
    let weekMinutes = 0
    const activeDaysSet = new Set()

    for (const s of sessions) {
      if (!s?.started_at) continue
      const d = new Date(s.started_at)
      if (d >= weekMon && d <= weekSun) {
        weekMinutes += s.duration_minutes || 0
        activeDaysSet.add(d.toDateString())
      }
    }

    // 2. Tasks completed this week (or completed total if completed_at not set)
    const completedTasksThisWeek = tasks.filter((t) => {
      if (t.status !== 'completed') return false
      if (t.completed_at) {
        const cd = new Date(t.completed_at)
        return cd >= weekMon && cd <= weekSun
      }
      return true
    }).length

    return {
      studyTimeStr: formatMinutes(weekMinutes),
      activeDays: activeDaysSet.size,
      tasksCompleted: completedTasksThisWeek,
    }
  }, [sessions, tasks])

  if (loading) {
    return (
      <div className="h-16 w-full animate-pulse rounded-2xl bg-surface-raised/40 border border-border" />
    )
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="w-full">
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 sm:py-3.5 border-border/80 bg-surface shadow-xs">
        {/* Left: Title & Inline Metric Pills */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                Overview
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                This Week
              </h4>
            </div>
          </div>

          <div className="h-6 w-px bg-border hidden sm:block" aria-hidden="true" />

          {/* Metric 1: Study Time */}
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="text-muted text-[11px]">Study Time:</span>
            <span className="font-bold text-foreground">{summary.studyTimeStr}</span>
          </div>

          {/* Metric 2: Active Days */}
          <div className="flex items-center gap-2 text-xs">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="text-muted text-[11px]">Active Days:</span>
            <span className="font-bold text-foreground">{summary.activeDays}</span>
          </div>

          {/* Metric 3: Tasks Completed */}
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-muted text-[11px]">Tasks Completed:</span>
            <span className="font-bold text-foreground">{summary.tasksCompleted}</span>
          </div>
        </div>

        {/* Right: Link to Retrospective Analytics */}
        <Link
          to="/analytics"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80 transition-colors shrink-0 group self-end sm:self-center cursor-pointer"
        >
          <span>View Learning Insights</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </Card>
    </motion.div>
  )
}
