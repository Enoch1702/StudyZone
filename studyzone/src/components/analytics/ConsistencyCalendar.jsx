import { motion } from 'motion/react'
import { Check, Flame, Minus } from 'lucide-react'
import { formatMinutes } from '../../services/learningAnalyticsService'
import { cn } from '../../lib/utils'
import { staggerContainer, staggerItem } from '../../lib/motion'

/**
 * Weekly Consistency Calendar Component.
 * Displays the user's last 7 calendar days with study activity indicators and durations.
 *
 * @param {Object} props
 * @param {Array} props.calendar - 7-day array [{ dateStr, dayLabel, dayNumber, isStudied, durationMinutes, isToday }]
 * @param {number} props.currentStreak - Current consecutive study days ending today
 * @param {number} props.longestStreak - Historical longest streak
 * @param {number} props.activeDays7d - Active days count in last 7 days
 */
export function ConsistencyCalendar({
  calendar = [],
  currentStreak = 0,
  longestStreak = 0,
  activeDays7d = 0,
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/20">
              <Flame className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              7-Day Study Consistency
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Tracking daily active study sessions over the last 7 calendar days.
          </p>
        </div>

        {/* Streak summary pill */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
            <Flame className="h-3.5 w-3.5" />
            <span>{currentStreak} Day Current Streak</span>
          </div>

          {longestStreak > 0 && (
            <span className="hidden text-[11px] font-medium text-muted sm:inline">
              (Best: {longestStreak}d)
            </span>
          )}
        </div>
      </div>

      {/* 7-Day Visual Calendar Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-5 grid grid-cols-7 gap-2 sm:gap-3"
      >
        {calendar.map((day) => {
          return (
            <motion.div
              key={day.dateStr}
              variants={staggerItem}
              className={cn(
                'relative flex flex-col items-center justify-between rounded-xl border p-2.5 sm:p-3.5 transition-all text-center min-h-[96px]',
                day.isStudied
                  ? 'border-accent/40 bg-accent/8 shadow-2xs'
                  : 'border-border/60 bg-surface-raised/40',
                day.isToday && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
              )}
            >
              {/* Day Label & Date */}
              <div className="space-y-0.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {day.dayLabel}
                </span>
                <span
                  className={cn(
                    'block text-sm font-bold',
                    day.isToday ? 'text-accent' : 'text-foreground',
                  )}
                >
                  {day.dayNumber}
                </span>
              </div>

              {/* Status Indicator Icon */}
              <div className="my-1">
                {day.isStudied ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-xs">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-raised border border-border text-muted">
                    <Minus className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              {/* Duration or Today Badge */}
              <div>
                {day.isStudied ? (
                  <span className="block text-[10px] font-semibold text-accent tabular-nums truncate max-w-full">
                    {formatMinutes(day.durationMinutes)}
                  </span>
                ) : day.isToday ? (
                  <span className="block text-[10px] font-semibold text-muted uppercase tracking-wide">
                    Today
                  </span>
                ) : (
                  <span className="block text-[10px] text-muted-foreground/60">—</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Summary Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50 text-xs text-muted">
        <span>
          <strong className="text-foreground font-semibold">{activeDays7d} of 7</strong> active study days this week
        </span>
        <span>
          {currentStreak === 0
            ? 'Log a focus session today to start your streak!'
            : `Streak active! Keep going tomorrow.`}
        </span>
      </div>
    </div>
  )
}
