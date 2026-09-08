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
      className="relative overflow-hidden flex flex-col gap-4 rounded-2xl border border-accent/25 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-surface dark:from-blue-950/25 dark:via-surface dark:to-surface-raised/30 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.08)] sm:flex-row sm:items-center sm:justify-between transition-all"
    >
      {/* Decorative ambient gradient corner */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {greeting} 👋
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {displayName}
        </h2>
        <p className="mt-1 text-xs text-accent font-semibold tracking-wide">
          Ready to continue where you left off?
        </p>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-2.5">
        <Link
          to="/focus"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-raised transition-all cursor-pointer shadow-2xs"
        >
          <Timer className="h-4 w-4 text-amber-500" />
          <span>Quick Timer</span>
        </Link>

        <Link
          to="/ai-assistant"
          state={{ prompt: 'Help me decide what I should focus on next.' }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask AI Tutor</span>
        </Link>
      </div>
    </motion.section>
  )
}
