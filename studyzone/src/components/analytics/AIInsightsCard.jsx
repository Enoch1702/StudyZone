import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Clock,
  Compass,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { fadeUp } from '../../lib/motion'

const QUICK_COACHING_PROMPTS = [
  {
    id: 'weekly_review',
    label: 'Review My Week',
    description: 'Get an in-depth weekly review of your momentum & habits',
    icon: TrendingUp,
    prompt: 'Give me a comprehensive weekly learning review based on my study consistency, study time, and task completion.',
  },
  {
    id: 'improvements',
    label: 'What Should I Improve?',
    description: 'Find study gaps, neglected areas, and habit tweaks',
    icon: Lightbulb,
    prompt: 'Based on my learning analytics and neglected subjects, what specific habits and focus areas should I improve?',
  },
  {
    id: 'workload',
    label: 'Analyze Workload',
    description: 'Evaluate upcoming tasks, deadlines, and busiest days',
    icon: Clock,
    prompt: 'Analyze my upcoming workload and tell me if my schedule for the next 7 days is manageable.',
  },
  {
    id: 'next_focus',
    label: 'What Should I Focus On Next?',
    description: 'Get actionable priority recommendations for today',
    icon: Compass,
    prompt: 'What should I focus on next to maintain study momentum and prepare for my upcoming priorities?',
  },
]

/**
 * AI Learning Coach Launchpad on Analytics Page.
 * Provides instant coaching prompts that deep-link into the unified AI Assistant.
 */
export function AIInsightsCard({ analyticsSummary = null }) {
  const navigate = useNavigate()

  function handleOpenCoachWithPrompt(prompt) {
    navigate('/ai-assistant', { state: { prompt } })
  }

  const streak = analyticsSummary?.consistency?.current_streak ?? 0
  const activeDays = analyticsSummary?.consistency?.active_days_7d ?? 0
  const workloadLevel = analyticsSummary?.upcoming_workload?.workload_level || 'Balanced'

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/8 via-surface to-surface p-5 shadow-xs sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                AI Learning Coach
              </h2>
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent border border-accent/30">
                Personalized
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Personalized coaching and study planning based on your verified {streak}-day streak and {workloadLevel.toLowerCase()} workload.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => navigate('/ai-assistant')}
          className="gap-1.5 text-xs self-start sm:self-auto"
        >
          <span>Open AI Assistant</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Quick Coaching Options */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            Choose a Coaching Focus to Ask AI:
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Active Days: <strong className="text-foreground">{activeDays}/7</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_COACHING_PROMPTS.map((qp) => {
            const Icon = qp.icon
            return (
              <button
                key={qp.id}
                type="button"
                onClick={() => handleOpenCoachWithPrompt(qp.prompt)}
                className="group flex flex-col justify-between rounded-xl border border-border bg-surface-raised/50 p-3.5 text-left transition-all hover:border-accent/50 hover:bg-surface-raised hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="mt-2.5 text-xs font-semibold text-foreground group-hover:text-accent transition-colors">
                    {qp.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted leading-relaxed line-clamp-2">
                    {qp.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
