import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarDays, Plus, Sparkles, Timer } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { getGreeting } from '../../lib/utils'
import { fadeUp } from '../../lib/motion'

/**
 * Clean, authoritative Page Header for the Daily Action Hub.
 * - Displays contextual day/date and warm greeting
 * - Contextual quick action buttons (Start Focus, Add Task, Ask Assistant)
 * - Free of repetitive card borders to let the page breathe
 */
export function WelcomeSection() {
  const { profile, user } = useAuth()
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const greeting = getGreeting()

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1 pb-1"
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
          <CalendarDays className="h-3.5 w-3.5 text-accent" />
          <span>{todayStr}</span>
          <span className="text-border">•</span>
          <span>{greeting}</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {displayName}
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted">
          Your daily study agenda, active tasks, and focus momentum.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-raised transition-colors shadow-xs"
        >
          <Plus className="h-3.5 w-3.5 text-muted" />
          <span>New Task</span>
        </Link>

        <Link
          to="/focus"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-raised transition-colors shadow-xs"
        >
          <Timer className="h-3.5 w-3.5 text-accent" />
          <span>Quick Timer</span>
        </Link>

        <Link
          to="/ai-assistant"
          state={{ prompt: 'Help me prioritize my study goals for today.' }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover transition-colors shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask Assistant</span>
          <span className="sm:hidden">Assistant</span>
        </Link>
      </div>
    </motion.section>
  )
}
