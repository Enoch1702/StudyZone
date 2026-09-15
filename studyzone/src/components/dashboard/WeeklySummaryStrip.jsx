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
      <Card className="flex flex-col p-5 border-border/80 bg-surface shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                Momentum
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                This Week&apos;s Progress
              </h4>
            </div>
          </div>

          <Link
            to="/analytics"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline shrink-0 group cursor-pointer"
          >
            <span>Insights</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 3 Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60">
          <div className="flex flex-col p-2.5 rounded-lg bg-surface-raised/40 border border-border/40 text-center sm:text-left">
            <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
              <Clock className="h-3 w-3 text-blue-500 shrink-0" />
              <span className="truncate">Time</span>
            </div>
            <span className="text-sm sm:text-base font-bold text-foreground truncate">{summary.studyTimeStr}</span>
          </div>

          <div className="flex flex-col p-2.5 rounded-lg bg-surface-raised/40 border border-border/40 text-center sm:text-left">
            <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
              <CalendarDays className="h-3 w-3 text-indigo-500 shrink-0" />
              <span className="truncate">Days</span>
            </div>
            <span className="text-sm sm:text-base font-bold text-foreground truncate">{summary.activeDays}</span>
          </div>

          <div className="flex flex-col p-2.5 rounded-lg bg-surface-raised/40 border border-border/40 text-center sm:text-left">
            <div className="flex items-center gap-1.5 text-muted text-[11px] mb-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="truncate">Done</span>
            </div>
            <span className="text-sm sm:text-base font-bold text-foreground truncate">{summary.tasksCompleted}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
