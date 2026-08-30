import { useMemo } from 'react'
import { Flame, Sparkles } from 'lucide-react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
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
    <Card className="flex h-full flex-col p-0">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5 flex items-center justify-between">
        <SectionHeader
          title="Daily Study Wrap-Up"
          description="Your daily reflection and learning momentum."
        />
        {currentStreak > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-500 shrink-0">
            <Flame className="h-3 w-3" />
            <span>{currentStreak}d streak</span>
          </span>
        )}
      </div>

      <div className="flex-1 p-4 sm:p-5">
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
