import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import {
  AlertCircle,
  Bot,
  Clock,
  Compass,
  Lightbulb,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { sendMessage } from '../../services/aiService'
import { AIActionProposal } from '../ai/AIActionProposal'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { fadeUp } from '../../lib/motion'

const QUICK_PROMPTS = [
  {
    id: 'weekly_review',
    label: 'Review My Week',
    icon: TrendingUp,
    prompt: 'Give me a comprehensive weekly learning review based on my study consistency, study time, and task completion.',
  },
  {
    id: 'improvements',
    label: 'What Should I Improve?',
    icon: Lightbulb,
    prompt: 'Based on my learning analytics and neglected subjects, what specific habits and focus areas should I improve?',
  },
  {
    id: 'workload',
    label: 'Analyze Workload',
    icon: Clock,
    prompt: 'Analyze my upcoming workload and tell me if my schedule for the next 7 days is manageable.',
  },
  {
    id: 'next_focus',
    label: 'What Should I Focus On Next?',
    icon: Compass,
    prompt: 'What should I focus on next to maintain study momentum and prepare for my upcoming priorities?',
  },
]

/**
 * Formats basic markdown text: headers (###, ##, #), bullet lists (- or *), bold (**text**), and inline code (`code`).
 */
function renderFormattedInsight(text) {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    // Bullet points
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '')
        listItems.push(
          <li key={`li-${i}`} className="leading-relaxed">
            {renderInline(itemText)}
          </li>,
        )
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2.5 space-y-1.5 pl-5 list-disc text-muted">
          {listItems}
        </ul>,
      )
      continue
    }

    // H3 Header (###)
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="mt-4 mb-1.5 text-sm font-bold text-foreground">
          {renderInline(line.replace(/^###\s+/, ''))}
        </h4>,
      )
      i++
      continue
    }

    // H2 Header (##)
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="mt-5 mb-2 text-base font-bold text-foreground border-b border-border/50 pb-1">
          {renderInline(line.replace(/^##\s+/, ''))}
        </h3>,
      )
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-xs sm:text-sm leading-relaxed text-foreground/90">
        {renderInline(line)}
      </p>,
    )
    i++
  }

  return <div className="space-y-1">{elements}</div>
}

function renderInline(text) {
  if (!text) return null
  const parts = text.split(/(`[^`]+`|[*][*][^*]+[*][*])/g)

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="rounded bg-surface-raised px-1.5 py-0.5 text-xs font-mono text-accent border border-border">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

/**
 * AI Learning Insights & Coach Component (Phase 8B).
 * Translates deterministic analytics into personalized, actionable learning recommendations.
 */
export function AIInsightsCard({
  analyticsSummary = null,
  subjects = [],
  existingTasks = [],
  existingDeadlines = [],
  existingPlans = [],
  onActionsApplied,
}) {
  const [activePromptId, setActivePromptId] = useState(null)
  const [insight, setInsight] = useState(null)
  const [actions, setActions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [customQuestion, setCustomQuestion] = useState('')

  const conversationHistory = useRef([])

  // Check if account has any recorded activity
  const hasActivity =
    analyticsSummary &&
    (analyticsSummary.consistency?.active_days_30d > 0 ||
      analyticsSummary.study_time?.total_minutes_7d > 0 ||
      analyticsSummary.task_progress?.tasks_created > 0 ||
      analyticsSummary.upcoming_workload?.upcoming_tasks > 0 ||
      subjects.length > 0)

  async function handleSendPrompt(promptText, promptId = null) {
    if (!promptText?.trim() || isLoading) return

    setActivePromptId(promptId)
    setIsLoading(true)
    setError(null)

    try {
      const response = await sendMessage({
        message: promptText,
        history: conversationHistory.current,
        analyticsSummary,
      })

      setInsight(response.reply)
      setActions(response.actions || [])

      // Update limited ephemeral history
      conversationHistory.current = [
        ...conversationHistory.current.slice(-6),
        { role: 'user', content: promptText },
        { role: 'assistant', content: response.reply },
      ]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI insights.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCustomSubmit(e) {
    e.preventDefault()
    if (!customQuestion.trim()) return
    const text = customQuestion.trim()
    setCustomQuestion('')
    handleSendPrompt(text, 'custom')
  }

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
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              AI Learning Coach
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent border border-accent/30">
                Phase 8B Intelligence
              </span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Personalized insights and coaching based on your real StudyZone consistency and workload.
            </p>
          </div>
        </div>

        {insight && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSendPrompt(QUICK_PROMPTS[0].prompt, QUICK_PROMPTS[0].id)}
            disabled={isLoading}
            className="gap-1.5 text-xs self-start sm:self-auto"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            <span>Re-analyze</span>
          </Button>
        )}
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="mt-4">
        <span className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
          Choose a Coaching Focus:
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_PROMPTS.map((qp) => {
            const Icon = qp.icon
            const isSelected = activePromptId === qp.id

            return (
              <button
                key={qp.id}
                type="button"
                onClick={() => handleSendPrompt(qp.prompt, qp.id)}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-medium transition-all',
                  isSelected
                    ? 'border-accent bg-accent/15 text-accent font-semibold shadow-2xs'
                    : 'border-border bg-surface-raised/50 text-foreground hover:border-accent/40 hover:bg-surface-raised',
                  isLoading && 'opacity-60 cursor-not-allowed',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-accent' : 'text-muted')} />
                <span className="truncate">{qp.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Response / Insight Display */}
      <div className="mt-5">
        {isLoading ? (
          <div className="rounded-xl border border-border bg-surface-raised/30 p-6 text-center flex flex-col items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent mb-3 animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">AI Coach is analyzing your analytics...</p>
            <p className="text-[11px] text-muted mt-1">
              Evaluating consistency streak, subject balance, upcoming workload, and goal alignment.
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : insight ? (
          <div className="rounded-xl border border-border/80 bg-surface-raised/40 p-4 sm:p-5">
            <div className="prose prose-invert max-w-none text-xs sm:text-sm">
              {renderFormattedInsight(insight)}
            </div>

            {/* Embedded Action Proposals if AI suggested tasks/deadlines/plans */}
            {actions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/60">
                <AIActionProposal
                  actions={actions}
                  subjects={subjects}
                  existingTasks={existingTasks}
                  existingDeadlines={existingDeadlines}
                  existingPlans={existingPlans}
                  onActionsApplied={() => {
                    setActions([])
                    if (onActionsApplied) onActionsApplied()
                  }}
                />
              </div>
            )}
          </div>
        ) : !hasActivity ? (
          /* Empty State for brand new users */
          <div className="rounded-xl border border-border/60 bg-surface-raised/30 p-5 text-center flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised border border-border text-muted mb-2">
              <Bot className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">Welcome to StudyZone AI Coaching</p>
            <p className="text-[11px] text-muted mt-1 max-w-md leading-relaxed">
              Add your subjects, create tasks, or log a study session to unlock deep personalized learning reviews, workload analysis, and habit coaching.
            </p>
            <button
              type="button"
              onClick={() =>
                handleSendPrompt(
                  'I am a new learner in StudyZone. What are the best strategies to start building a consistent study habit?',
                  'getting_started',
                )
              }
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Get Started with Study Strategies</span>
            </button>
          </div>
        ) : (
          /* Default Call-to-action before first query */
          <div className="rounded-xl border border-dashed border-border/80 bg-surface-raised/20 p-5 text-center">
            <p className="text-xs font-semibold text-foreground">
              Ready for your personalized learning analysis
            </p>
            <p className="text-[11px] text-muted mt-1">
              Select one of the coaching options above or ask a specific question below.
            </p>
          </div>
        )}
      </div>

      {/* Follow-up question input */}
      <form onSubmit={handleCustomSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Ask a specific coaching question (e.g. 'How can I balance Java and DBMS?')..."
          disabled={isLoading}
          className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!customQuestion.trim() || isLoading}
          className="gap-1.5 shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask Coach</span>
        </Button>
      </form>
    </motion.div>
  )
}
