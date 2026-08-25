import { useMemo } from 'react'
import { Flame, Moon, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { formatMinutesToHoursMinutes } from '../../lib/utils'

export function DailyWrapUpCard({ tasks = [], sessions = [], currentStreak = 0 }) {
  const todayStr = new Date().toISOString().slice(0, 10)

  // Compute today's actual numbers
  const todaySessions = useMemo(() => {
    return (sessions || []).filter(
      (s) => s.started_at && s.started_at.slice(0, 10) === todayStr,
    )
  }, [sessions, todayStr])

  const todayFocusMinutes = useMemo(() => {
    return todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
  }, [todaySessions])

  const todayCompletedTasks = useMemo(() => {
    return (tasks || []).filter(
      (t) =>
        t.status === 'completed' &&
        t.completed_at &&
        t.completed_at.slice(0, 10) === todayStr,
    )
  }, [tasks, todayStr])

  const todaySubjectCount = useMemo(() => {
    const ids = new Set(todaySessions.map((s) => s.subject_id).filter(Boolean))
    return ids.size
  }, [todaySessions])

  const hasActivityToday = todayFocusMinutes > 0 || todayCompletedTasks.length > 0

  return (
    <Card className="border-border/90 bg-gradient-to-br from-surface via-surface to-surface-raised shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-purple-400" />
            <CardTitle className="text-sm font-bold">Daily Study Wrap-Up</CardTitle>
          </div>
          {currentStreak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-400">
              <Flame className="h-3 w-3" />
              {currentStreak}d streak
            </span>
          )}
        </div>
        <CardDescription className="text-xs">
          Your daily reflection and learning momentum summary.
        </CardDescription>
      </CardHeader>

      <div className="p-4 pt-0 space-y-3">
        {hasActivityToday ? (
          <>
            <p className="text-xs text-foreground/90 leading-relaxed font-medium">
              Today you completed{' '}
              <strong className="text-accent">{todayCompletedTasks.length} task{todayCompletedTasks.length === 1 ? '' : 's'}</strong>{' '}
              and logged{' '}
              <strong className="text-accent">{formatMinutesToHoursMinutes(todayFocusMinutes)}</strong> of focused study
              {todaySubjectCount > 0 ? ` across ${todaySubjectCount} learning area${todaySubjectCount === 1 ? '' : 's'}` : ''}. Excellent consistency!
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="rounded-xl bg-surface-raised/70 border border-border/80 p-2.5 text-center">
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block">Focus Time</span>
                <span className="text-xs sm:text-sm font-extrabold text-foreground">{formatMinutesToHoursMinutes(todayFocusMinutes)}</span>
              </div>
              <div className="rounded-xl bg-surface-raised/70 border border-border/80 p-2.5 text-center">
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block">Tasks Done</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-400">{todayCompletedTasks.length}</span>
              </div>
              <div className="rounded-xl bg-surface-raised/70 border border-border/80 p-2.5 text-center">
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block">Subjects</span>
                <span className="text-xs sm:text-sm font-extrabold text-purple-400">{todaySubjectCount}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-surface-raised/40 border border-border/70 p-3 text-center">
            <Sparkles className="h-4 w-4 mx-auto text-muted mb-1" />
            <p className="text-xs text-muted leading-relaxed">
              Your day is still open — start a focus session or complete a priority task to build your daily learning momentum.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
