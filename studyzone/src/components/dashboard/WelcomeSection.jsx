import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Sparkles, Timer } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { getGreeting } from '../../lib/utils'
import { fadeUp } from '../../lib/motion'

/**
 * Clean, focused Welcome Section for the Daily Action Hub.
 * Strictly:
 * - NO learner role badge (e.g. "College")
 * - NO unnecessary statistics
 * - Warm, contextual time-of-day greeting
 */
export function WelcomeSection() {
  const { profile, user } = useAuth()
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const greeting = getGreeting()

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between transition-colors"
    >
      <div>
        <p className="text-xs font-medium text-muted">
          {greeting}
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {displayName}
        </h2>
        <p className="mt-1 text-xs text-muted">
          Ready to continue where you left off?
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <Link
          to="/focus"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground hover:bg-surface-raised transition-colors shadow-xs"
        >
          <Timer className="h-3.5 w-3.5 text-muted" />
          <span>Quick Timer</span>
        </Link>

        <Link
          to="/ai-assistant"
          state={{ prompt: 'Help me decide what I should focus on next.' }}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white hover:bg-accent-hover transition-colors shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask Study Assistant</span>
        </Link>
      </div>
    </motion.section>
  )
}
