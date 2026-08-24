import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Flame, TrendingUp } from 'lucide-react'
import { fadeUp } from '../../lib/motion'

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
  const topNeglected = neglectedAreas[0] || null

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/20">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Learning Insights
          </h2>
        </div>

        <Link
          to="/analytics"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <span>View Insights</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2 py-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-8 rounded-lg bg-surface-raised/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Signal 1: Study Streak */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-raised/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Flame className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="text-foreground truncate font-medium">
                {currentStreak > 0
                  ? `${currentStreak}-day study streak`
                  : 'No active streak today'}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-accent shrink-0">
              {currentStreak > 0 ? 'Active' : 'Log focus'}
            </span>
          </div>

          {/* Signal 2: Weekly Active Days */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-raised/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs shrink-0">📚</span>
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
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-raised/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs shrink-0">{topNeglected ? '⚠️' : '🎯'}</span>
              <span className="text-foreground truncate font-medium">
                {topNeglected
                  ? `${topNeglected.subjectName} needs attention`
                  : `${completionRate}% task completion rate`}
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted shrink-0">
              {topNeglected
                ? topNeglected.daysSinceLastStudy === null
                  ? 'Never studied'
                  : `${topNeglected.daysSinceLastStudy}d inactive`
                : '30d rate'}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
