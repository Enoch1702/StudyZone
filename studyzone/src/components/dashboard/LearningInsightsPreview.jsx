import { Link } from 'react-router-dom'
import { ArrowRight, Flame, TrendingUp } from 'lucide-react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'

/**
 * Compact Dashboard card displaying up to 3 useful real deterministic signals
 * and linking to the full /analytics page.
 *
 * @param {Object} props
 * @param {number} props.currentStreak
 * @param {number} props.activeDays7d
 * @param {Array} props.neglectedAreas
 * @param {number} props.completionRate
 * @param {boolean} props.loading
 */
export function LearningInsightsPreview({
  currentStreak = 0,
  activeDays7d = 0,
  neglectedAreas = [],
  completionRate = 0,
  loading = false,
}) {
  const topNeglected = (Array.isArray(neglectedAreas) && neglectedAreas[0]) || null
  const subjectLabel = topNeglected?.subjectName || topNeglected?.name || null

  return (
    <Card className="flex h-full flex-col p-0">
      {/* Header */}
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5 flex items-center justify-between">
        <SectionHeader
          title="Learning Insights"
          description={loading ? 'Analyzing…' : 'Consistency & attention'}
        />
        <Link
          to="/analytics"
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View all</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
        {loading ? (
          <div className="space-y-2 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-9 rounded-xl bg-surface-raised/50" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Signal 1: Study Streak */}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-foreground truncate font-medium">
                  {currentStreak > 0
                    ? `${currentStreak}-day study streak`
                    : 'No active streak today'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-accent shrink-0">
                {currentStreak > 0 ? 'Active' : 'Log focus'}
              </span>
            </div>

            {/* Signal 2: Weekly Active Days */}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-foreground truncate font-medium">
                  {activeDays7d > 0
                    ? `${activeDays7d} of 7 active days this week`
                    : '0 active days this week'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted shrink-0">
                Last 7d
              </span>
            </div>

            {/* Signal 3: Attention Alert or Task Rate */}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs shrink-0">{subjectLabel ? '⚠️' : '🎯'}</span>
                <span className="text-foreground truncate font-medium">
                  {subjectLabel
                    ? `${subjectLabel} needs attention`
                    : `${completionRate}% task completion rate`}
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted shrink-0">
                {subjectLabel ? 'Neglected' : 'Tasks'}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
