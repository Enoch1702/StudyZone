import { motion } from 'motion/react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'

const CHART_HEIGHT = 140
const CHART_PADDING = { top: 8, bottom: 24, left: 32, right: 8 }
const WEEKLY_GOAL_HOURS = 25

/**
 * @param {{ loading: boolean, weeklyActivity: Array<{ day: string, hours: number }>|null }} props
 */
export function ProductivityChart({ loading, weeklyActivity }) {
  // While loading or no data yet, use all-zero placeholder
  const activity = weeklyActivity ?? [
    { day: 'Mon', hours: 0 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ]

  const totalHours = activity.reduce((sum, d) => sum + d.hours, 0)
  const avgHours = activity.length > 0 ? totalHours / activity.length : 0
  const maxHours = Math.max(...activity.map((d) => d.hours), WEEKLY_GOAL_HOURS / 7, 0.5)
  const todayIndex = (new Date().getDay() + 6) % 7 // 0=Mon … 6=Sun

  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const barWidth = 28
  const gap = 12
  const chartWidth =
    CHART_PADDING.left +
    activity.length * barWidth +
    (activity.length - 1) * gap +
    CHART_PADDING.right

  const scaleY = (hours) =>
    CHART_PADDING.top + innerHeight - (hours / maxHours) * innerHeight

  const goalY = scaleY(WEEKLY_GOAL_HOURS / 7)
  const hasActivity = totalHours > 0

  return (
    <Card className="p-0">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <SectionHeader
          title="Weekly Activity"
          description={
            loading
              ? 'Loading…'
              : hasActivity
              ? `${totalHours.toFixed(1)}h studied · ${avgHours.toFixed(1)}h daily avg`
              : 'No study sessions recorded this week'
          }
          action={
            <span className="text-xs text-muted-foreground">
              Goal: {WEEKLY_GOAL_HOURS}h/week
            </span>
          }
        />
      </div>

      <div className="overflow-x-auto px-2 py-4 sm:px-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
          className="mx-auto w-full max-w-full"
          style={{ minWidth: `${Math.min(chartWidth, 320)}px`, height: CHART_HEIGHT }}
          role="img"
          aria-label={`Weekly study hours: ${activity.map((d) => `${d.day} ${d.hours} hours`).join(', ')}`}
        >
          <defs>
            <linearGradient id="chartBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.75" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="todayBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Average reference line — only when there is activity */}
          {hasActivity && (
            <>
              <line
                x1={CHART_PADDING.left}
                y1={scaleY(avgHours)}
                x2={chartWidth - CHART_PADDING.right}
                y2={scaleY(avgHours)}
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeDasharray="4 4"
              />
              <text
                x={CHART_PADDING.left - 4}
                y={scaleY(avgHours) + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                avg
              </text>
            </>
          )}

          {/* Daily goal reference */}
          <line
            x1={CHART_PADDING.left}
            y1={goalY}
            x2={chartWidth - CHART_PADDING.right}
            y2={goalY}
            stroke="var(--color-accent)"
            strokeOpacity={0.25}
            strokeDasharray="2 3"
          />

          {activity.map((day, i) => {
            const x = CHART_PADDING.left + i * (barWidth + gap)
            const targetBarHeight = Math.max((day.hours / maxHours) * innerHeight, 3)
            const isToday = i === todayIndex

            return (
              <g key={day.day}>
                <motion.rect
                  x={x}
                  y={CHART_PADDING.top + innerHeight - targetBarHeight}
                  width={barWidth}
                  height={loading ? 2 : targetBarHeight}
                  rx={5}
                  fill={isToday ? 'url(#todayBarGradient)' : 'url(#chartBarGradient)'}
                  initial={{ scaleY: 0, originY: 1 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                  style={{ transformOrigin: `${x}px ${CHART_PADDING.top + innerHeight}px` }}
                />
                {!loading && day.hours > 0 && (
                  <motion.text
                    x={x + barWidth / 2}
                    y={CHART_PADDING.top + innerHeight - targetBarHeight - 6}
                    textAnchor="middle"
                    className="fill-muted text-[10px] font-medium"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 + 0.2 }}
                  >
                    {day.hours}h
                  </motion.text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-medium ${isToday ? 'fill-accent' : 'fill-muted-foreground'}`}
                >
                  {day.day}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border-subtle px-4 py-3 text-[11px] text-muted-foreground sm:px-5">
        {hasActivity && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t border-dashed border-muted-foreground/50" />
            Daily average
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 border-t border-dashed border-accent/50" />
          Daily goal (~{(WEEKLY_GOAL_HOURS / 7).toFixed(1)}h)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-accent" />
          Today
        </span>
      </div>
    </Card>
  )
}
