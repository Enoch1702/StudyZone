import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { getGreeting } from '../../lib/utils'
import { fadeUp } from '../../lib/motion'
import { getPersonalizedGreeting, getLearnerTypeShortLabel } from '../../lib/learnerProfile'

/**
 * @param {{ loading: boolean, stats: object|null, focusTasks: Array, deadlines: Array }} props
 */
export function WelcomeSection({ loading, focusTasks, deadlines }) {
  const { profile, user } = useAuth()
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const greeting = getGreeting()
  const personalizedMessage = getPersonalizedGreeting(
    profile?.learner_type,
    profile?.primary_goal,
    profile?.learning_focus,
  )
  const learnerBadge = getLearnerTypeShortLabel(profile?.learner_type)

  // Count incomplete focus tasks
  const tasksDueToday = focusTasks.filter((t) => t.status !== 'completed').length

  // Count deadlines within next 7 days
  const now = new Date()
  const sevenDaysLater = new Date(now)
  sevenDaysLater.setDate(now.getDate() + 7)
  const deadlinesThisWeek = deadlines.filter((d) => {
    const due = new Date(d.due_date)
    return due >= now && due <= sevenDaysLater
  }).length

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-surface via-surface to-surface-raised/30 p-5 sm:p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between transition-all"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{greeting}</p>
          <span className="rounded-full bg-accent-muted border border-accent/25 px-2.5 py-0.5 text-[11px] font-bold text-accent">
            {learnerBadge}
          </span>
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {displayName}
        </h2>
        <p className="mt-1.5 text-xs text-accent font-semibold tracking-wide">
          {personalizedMessage}
        </p>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted">
          {loading ? (
            <span className="inline-block h-3.5 w-48 animate-pulse rounded bg-surface-raised" />
          ) : (
            <>
              <span className="font-bold text-foreground">{tasksDueToday}</span> task{tasksDueToday !== 1 ? 's' : ''} remaining today
              {' · '}
              <span className="font-bold text-foreground">{deadlinesThisWeek}</span> deadline{deadlinesThisWeek !== 1 ? 's' : ''} on your radar this week.
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
        <Link
          to="/ai-assistant"
          state={{ prompt: 'Help me decide what I should focus on next.' }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask AI Coach</span>
        </Link>
      </div>
    </motion.section>
  )
}
