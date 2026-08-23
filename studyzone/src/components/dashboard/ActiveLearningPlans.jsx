import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Compass, Milestone, Plus } from 'lucide-react'
import { calculatePlanProgress } from '../../services/learningPlansService'
import { fadeUp, staggerContainer, staggerItem } from '../../lib/motion'

/**
 * Compact Dashboard card displaying active learning plans with real progress
 * and next upcoming milestones.
 */
export function ActiveLearningPlans({
  plans = [],
  milestones = [],
  tasks = [],
  loading = false,
}) {
  const activePlans = plans.filter((p) => p.status === 'active').slice(0, 3)

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/20">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Active Learning Plans
            </h2>
          </div>
        </div>

        <Link
          to="/plans"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2 rounded-xl bg-surface-raised/40 p-3">
              <div className="h-3 w-1/2 rounded bg-surface-raised" />
              <div className="h-2 w-full rounded bg-surface-raised" />
            </div>
          ))}
        </div>
      ) : activePlans.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/8 border border-accent/20 text-accent mb-2.5">
            <Compass className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-foreground">No active learning plans</p>
          <p className="mt-1 text-[11px] text-muted max-w-xs">
            Turn your bigger learning goals into a structured roadmap with milestones.
          </p>
          <Link
            to="/plans"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent/10 hover:text-accent transition-colors border border-border"
          >
            <Plus className="h-3 w-3" />
            <span>Create a Plan</span>
          </Link>
        </div>
      ) : (
        /* Active Plans List */
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2.5">
          {activePlans.map((plan) => {
            const progress = calculatePlanProgress(plan, milestones, tasks)

            return (
              <motion.div key={plan.id} variants={staggerItem}>
                <Link
                  to={`/plans/${plan.id}`}
                  className="group block rounded-xl border border-border/60 bg-surface-raised/40 p-3 transition-all hover:border-accent/40 hover:bg-surface-raised/80 hover:shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                      {plan.title}
                    </span>
                    <span className="text-[11px] font-bold text-foreground shrink-0">
                      {progress.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface border border-border/40 mb-2">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  {/* Next milestone */}
                  {progress.nextMilestone ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted truncate">
                      <Milestone className="h-2.5 w-2.5 text-accent shrink-0" />
                      <span className="truncate">Next: {progress.nextMilestone.title}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted">
                      {progress.completedMilestonesCount} of {progress.totalMilestonesCount} milestones completed
                    </div>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
