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
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-5 py-5 transition-all duration-200 hover:border-border/80 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted tracking-wide">{greeting}</p>
          <span className="rounded-full bg-surface-raised border border-border/80 px-2 py-0.5 text-[10px] font-semibold text-muted">
            {learnerBadge}
          </span>
        </div>
        <h2 className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {displayName}
        </h2>
        <p className="mt-1.5 text-xs text-accent font-medium tracking-wide">
          {personalizedMessage}
        </p>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted">
          {loading ? (
            <span className="inline-block h-3.5 w-48 animate-pulse rounded bg-surface-raised" />
          ) : (
            <>
              <span className="font-semibold text-foreground">{tasksDueToday}</span> task{tasksDueToday !== 1 ? 's' : ''} remaining today
              {' · '}
              <span className="font-semibold text-foreground">{deadlinesThisWeek}</span> deadline{deadlinesThisWeek !== 1 ? 's' : ''} on your radar this week.
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-border-subtle pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
        <Link
          to="/ai-assistant"
          state={{ prompt: 'Help me decide what I should focus on next.' }}
          className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-xs font-semibold text-accent hover:border-accent hover:bg-accent/20 transition-all shadow-2xs"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask AI Coach</span>
        </Link>
      </div>
    </motion.section>
  )
}
