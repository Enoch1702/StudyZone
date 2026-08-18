import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
import { weeklyActivity, weeklyStudyGoal } from '../../data/mockData'

const CHART_HEIGHT = 140
const CHART_PADDING = { top: 8, bottom: 24, left: 32, right: 8 }

export function ProductivityChart() {
  const totalHours = weeklyActivity.reduce((sum, d) => sum + d.hours, 0)
  const avgHours = totalHours / weeklyActivity.length
  const maxHours = Math.max(...weeklyActivity.map((d) => d.hours), weeklyStudyGoal / 7)
  const todayIndex = (new Date().getDay() + 6) % 7

  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const barWidth = 28
  const gap = 12
  const chartWidth =
    CHART_PADDING.left +
    weeklyActivity.length * barWidth +
    (weeklyActivity.length - 1) * gap +
    CHART_PADDING.right

  const scaleY = (hours) =>
    CHART_PADDING.top + innerHeight - (hours / maxHours) * innerHeight

  const goalY = scaleY(weeklyStudyGoal / 7)

  return (
    <Card className="p-0">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <SectionHeader
          title="Weekly Activity"
          description={`${totalHours.toFixed(1)}h studied · ${avgHours.toFixed(1)}h daily avg`}
          action={
            <span className="text-xs text-muted-foreground">
              Goal: {weeklyStudyGoal}h/week
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
          aria-label={`Weekly study hours: ${weeklyActivity.map((d) => `${d.day} ${d.hours} hours`).join(', ')}`}
        >
          {/* Average reference line */}
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

          {weeklyActivity.map((day, i) => {
            const x = CHART_PADDING.left + i * (barWidth + gap)
            const barHeight = (day.hours / maxHours) * innerHeight
            const y = CHART_PADDING.top + innerHeight - barHeight
            const isToday = i === todayIndex

            return (
              <g key={day.day}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx={4}
                  fill={isToday ? 'var(--color-accent)' : 'var(--color-accent)'}
                  fillOpacity={isToday ? 1 : 0.55}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-muted text-[10px] font-medium"
                >
                  {day.hours}h
                </text>
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  className={`text-[10px] ${isToday ? 'fill-accent font-medium' : 'fill-muted-foreground'}`}
                >
                  {day.day}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border-subtle px-4 py-3 text-[11px] text-muted-foreground sm:px-5">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 border-t border-dashed border-muted-foreground/50" />
          Daily average
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 border-t border-dashed border-accent/50" />
          Daily goal (~{(weeklyStudyGoal / 7).toFixed(1)}h)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-accent" />
          Today
        </span>
      </div>
    </Card>
  )
}
