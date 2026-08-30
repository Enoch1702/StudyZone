import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Compass, Plus } from 'lucide-react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
import { calculatePlanProgress } from '../../services/learningPlansService'
import { staggerContainer, staggerItem } from '../../lib/motion'

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
    <Card className="flex h-full flex-col p-0">
      {/* Header */}
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5 flex items-center justify-between">
        <SectionHeader
          title="Active Learning Plans"
          description={
            loading
              ? 'Loading…'
              : `${activePlans.length} active roadmap${activePlans.length === 1 ? '' : 's'}`
          }
        />
        <Link
          to="/plans"
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View all</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
        {loading ? (
          <div className="space-y-3 py-1">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-2 rounded-xl bg-surface-raised/40 p-3">
                <div className="h-3 w-1/2 rounded bg-surface-raised" />
                <div className="h-2 w-full rounded bg-surface-raised" />
              </div>
            ))}
          </div>
        ) : activePlans.length === 0 ? (
          /* Empty State */
          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/8 border border-accent/20 text-accent mb-2.5">
              <Compass className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-foreground">No active learning plans</p>
            <p className="mt-1 text-[11px] text-muted max-w-xs leading-relaxed">
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
                    className="group block rounded-xl border border-border/70 bg-surface hover:border-accent/40 hover:bg-surface-raised/40 p-2.5 sm:p-3 transition-all"
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
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised border border-border/40 mb-1.5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span>
                        {progress.completedMilestones} of {progress.totalMilestones} milestones completed
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </Card>
  )
}
