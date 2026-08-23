import { useRef, useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { PageContainer } from '../components/layout/PageContainer'
import {
  ChatMessage,
  ThinkingIndicator,
  QuickPrompts,
  ChatComposer,
  EmptyConversation,
} from '../components/ai/AIStudyForm'
import { sendMessage } from '../services/aiService'
import { getSubjects } from '../services/subjectsService'
import { getTasks } from '../services/tasksService'
import { getDeadlines } from '../services/deadlinesService'
import { getLearningPlans } from '../services/learningPlansService'
import { executeApprovedActions } from '../services/aiActionService'
import { useAuth } from '../context/useAuth'
import { fadeUp, staggerContainer, staggerItem } from '../lib/motion'

// ---------------------------------------------------------------------------
// AI Assistant Page
// ---------------------------------------------------------------------------

/**
 * The main AI Assistant page.
 *
 * Capabilities:
 * - Conversational AI study planning, prioritization, revision, and checklists.
 * - Interactive action proposals (Tasks, Deadlines, Learning Plans) with user review & approval.
 * - Client-side state only (ephemeral conversation history).
 *
 * Security:
 * - No API keys in this file.
 * - User session JWT is automatically attached by the Supabase client.
 * - User identity is verified server-side in the Edge Function.
 * - Direct database writes only occur via authenticated user session after explicit approval.
 */
export default function AIAssistantPage() {
  const { user, profile } = useAuth()

  // Conversation state — client-side only, no persistence
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Local store of user's existing records for duplicate detection & subject linking
  const [existingSubjects, setExistingSubjects] = useState([])
  const [existingTasks, setExistingTasks] = useState([])
  const [existingDeadlines, setExistingDeadlines] = useState([])
  const [existingPlans, setExistingPlans] = useState([])

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Fetch initial workload records for validation and duplicate checking
  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    async function loadWorkload() {
      try {
        const [subRes, taskRes, deadRes, planRes] = await Promise.all([
          getSubjects(user.id),
          getTasks(user.id),
          getDeadlines(user.id),
          getLearningPlans(user.id),
        ])

        if (isMounted) {
          if (subRes.data) setExistingSubjects(subRes.data)
          if (taskRes.data) setExistingTasks(taskRes.data)
          if (deadRes.data) setExistingDeadlines(deadRes.data)
          if (planRes.data) setExistingPlans(planRes.data)
        }
      } catch (err) {
        console.warn('Could not load workload records for AI assistant:', err)
      }
    }

    loadWorkload()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // ---------------------------------------------------------------------------
  // Send message handler
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(
    async (messageText) => {
      const text = (messageText ?? inputValue).trim()

      if (!text) return
      if (isLoading) return
      if (!user) return

      // Append user message to conversation
      const userMessage = { role: 'user', content: text, id: `msg-${Date.now()}` }
      setMessages((prev) => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)

      // Build history from current messages (before appending the new one)
      const history = messages.map((m) => ({ role: m.role, content: m.content }))

      try {
        const { reply, actions } = await sendMessage({ message: text, history })

        const assistantMessage = {
          role: 'assistant',
          content: reply,
          actions: Array.isArray(actions) ? actions : [],
          appliedState: null,
          id: `msg-${Date.now()}-reply`,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        // On failure: preserve user's message so they can retry
        const errorMessage = {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          id: `msg-${Date.now()}-err`,
          isError: true,
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
        // Refocus textarea after response
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    },
    [inputValue, isLoading, messages, user],
  )

  // ---------------------------------------------------------------------------
  // Action proposal approval & dismissal handlers
  // ---------------------------------------------------------------------------

  const handleApplyActions = useCallback(
    async (messageId, selectedActions) => {
      if (!user?.id) throw new Error('You must be logged in to apply actions.')

      const res = await executeApprovedActions({
        userId: user.id,
        actions: selectedActions,
      })

      if (res.successCount > 0) {
        // Mark message proposal as applied
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, appliedState: { status: 'applied', count: res.successCount } }
              : msg,
          ),
        )

        // Refresh existing tasks & deadlines
        const [taskRes, deadRes] = await Promise.all([
          getTasks(user.id),
          getDeadlines(user.id),
        ])
        if (taskRes.data) setExistingTasks(taskRes.data)
        if (deadRes.data) setExistingDeadlines(deadRes.data)
      }

      return res
    },
    [user],
  )

  const handleDismissActions = useCallback((messageId) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, actions: [] } : msg)),
    )
  }, [])

  // Quick prompt handler — send immediately
  const handleQuickPrompt = useCallback(
    (prompt) => {
      if (!isLoading) {
        handleSend(prompt)
      }
    },
    [handleSend, isLoading],
  )

  const hasMessages = messages.length > 0

  return (
    <PageContainer width="medium">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        {/* ------------------------------------------------------------------ */}
        {/* Page header */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/8">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              AI Study Assistant & Planner
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Intelligent study planning, revision schedules, and task prioritization powered by your real StudyZone data.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Quick prompts */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick prompts
          </p>
          <QuickPrompts
            learnerType={profile?.learner_type}
            onSelect={handleQuickPrompt}
            disabled={isLoading}
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Conversation workspace */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col">
          {/* Conversation area */}
          <div className="flex-1 min-h-[360px] max-h-[540px] overflow-y-auto p-4 sm:p-5">
            <AnimatePresence initial={false}>
              {!hasMessages ? (
                <EmptyConversation key="empty" />
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      actions={msg.actions}
                      subjects={existingSubjects}
                      existingTasks={existingTasks}
                      existingDeadlines={existingDeadlines}
                      existingPlans={existingPlans}
                      appliedState={msg.appliedState}
                      onApplyActions={(actionsToApply) =>
                        handleApplyActions(msg.id, actionsToApply)
                      }
                      onDismissActions={() => handleDismissActions(msg.id)}
                      isError={msg.isError ?? false}
                    />
                  ))}

                  {/* Thinking indicator */}
                  <AnimatePresence>
                    {isLoading && <ThinkingIndicator key="thinking" />}
                  </AnimatePresence>

                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Composer */}
          <div className="p-3 sm:p-4">
            <ChatComposer
              value={inputValue}
              onChange={setInputValue}
              onSend={() => handleSend()}
              isLoading={isLoading}
              textareaRef={textareaRef}
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Enter to send · Shift + Enter for new line · Action proposals require your explicit approval before saving
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Capability hints (only shown before first message) */}
        {/* ------------------------------------------------------------------ */}
        <AnimatePresence>
          {!hasMessages && (
            <motion.div
              key="hints"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {CAPABILITY_HINTS.map(({ icon, title, description }) => (
                <motion.div
                  key={title}
                  variants={staggerItem}
                  className="rounded-xl border border-border bg-surface px-4 py-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-base">
                      {icon}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PageContainer>
  )
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CAPABILITY_HINTS = [
  {
    icon: '🎯',
    title: 'Daily & Weekly Planning',
    description: 'Get realistic, actionable study sessions structured around your upcoming deadlines.',
  },
  {
    icon: '📊',
    title: '4-Tier Prioritization',
    description: 'Group tasks into Do First, Do Next, Schedule, and Defer with clear rationale.',
  },
  {
    icon: '⚡',
    title: 'Action Proposals',
    description: 'Review and approve AI-generated tasks and deadlines before saving to your workspace.',
  },
]
