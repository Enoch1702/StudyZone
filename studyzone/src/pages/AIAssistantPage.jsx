import { useRef, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
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
import {
  fetchLearningAnalyticsData,
  calculateStudyConsistency,
  calculateStudyTimeStats,
  calculateLearningBalance,
  calculateNeglectedAreas,
  calculateTaskCompletion,
  calculateUpcomingWorkload,
  classifyWorkload,
  buildAnalyticsSummary,
} from '../services/learningAnalyticsService'
import { useAuth } from '../context/useAuth'
import { staggerContainer, staggerItem } from '../lib/motion'

/**
 * The main AI Assistant page.
 *
 * Capabilities:
 * - Conversational AI study planning, prioritization, revision, and checklists.
 * - Deep coaching based on real study consistency and workload metrics.
 * - Interactive action proposals (Tasks, Deadlines, Learning Plans) with user review & approval.
 * - Seamless deep-linking from the Analytics and Dashboard pages.
 */
export default function AIAssistantPage() {
  const { user, profile } = useAuth()
  const location = useLocation()

  // Conversation state — client-side only, no persistence
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Local store of user's existing records for duplicate detection & subject linking
  const [existingSubjects, setExistingSubjects] = useState([])
  const [existingTasks, setExistingTasks] = useState([])
  const [existingDeadlines, setExistingDeadlines] = useState([])
  const [existingPlans, setExistingPlans] = useState([])
  const [analyticsSummary, setAnalyticsSummary] = useState(null)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const initialPromptHandled = useRef(false)

  // Fetch initial workload and analytics records
  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    async function loadWorkloadAndAnalytics() {
      try {
        const [subRes, taskRes, deadRes, planRes, analyticsRes] = await Promise.all([
          getSubjects(user.id),
          getTasks(user.id),
          getDeadlines(user.id),
          getLearningPlans(user.id),
          fetchLearningAnalyticsData(user.id),
        ])

        if (isMounted) {
          if (subRes.data) setExistingSubjects(subRes.data)
          if (taskRes.data) setExistingTasks(taskRes.data)
          if (deadRes.data) setExistingDeadlines(deadRes.data)
          if (planRes.data) setExistingPlans(planRes.data)

          // Calculate deterministic analytics summary for AI context
          if (analyticsRes && !analyticsRes.error) {
            const consistency = calculateStudyConsistency(analyticsRes.sessions || [])
            const timeStats = calculateStudyTimeStats(analyticsRes.sessions || [])
            const learningBalance = calculateLearningBalance(analyticsRes.sessions || [], analyticsRes.subjects || [])
            const neglectedAreas = calculateNeglectedAreas(analyticsRes.sessions || [], analyticsRes.subjects || [])
            const taskCompletion = calculateTaskCompletion(analyticsRes.tasks || [])
            const upcomingWorkload = calculateUpcomingWorkload(analyticsRes.tasks || [], analyticsRes.deadlines || [])
            const workloadClassification = classifyWorkload(upcomingWorkload)

            const summary = buildAnalyticsSummary({
              consistency,
              timeStats,
              learningBalance,
              neglectedAreas,
              taskCompletion,
              upcomingWorkload,
              workloadClassification,
            })
            setAnalyticsSummary(summary)
          }
        }
      } catch (err) {
        console.warn('Could not load workload records for AI assistant:', err)
      }
    }

    loadWorkloadAndAnalytics()

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
        const { reply, actions } = await sendMessage({
          message: text,
          history,
          analyticsSummary,
        })

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
    [inputValue, isLoading, messages, user, analyticsSummary],
  )

  // Handle incoming prompt passed from Analytics or Dashboard navigation
  useEffect(() => {
    const incomingPrompt = location.state?.prompt
    if (incomingPrompt && !initialPromptHandled.current && user) {
      initialPromptHandled.current = true
      // Safely consume navigation state to prevent re-execution on reload
      try {
        window.history.replaceState({}, document.title)
      } catch {
        // ignore
      }
      handleSend(incomingPrompt)
    }
  }, [location.state, user, handleSend])

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
    <PageContainer width="wide" className="flex h-[calc(100vh-3.5rem)] flex-col p-4 sm:p-6">
      {/* Page Header */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-4 shrink-0"
      >
        <motion.div variants={staggerItem} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              AI Study Assistant & Planner
            </h1>
            <p className="text-xs text-muted">
              Intelligent study planning, revision schedules, and task prioritization powered by your real StudyZone data.
            </p>
          </div>
        </motion.div>

        {/* Quick Prompts Bar */}
        <motion.div variants={staggerItem} className="mt-3">
          <QuickPrompts
            learnerType={profile?.learner_type}
            onSelect={handleQuickPrompt}
            disabled={isLoading}
          />
        </motion.div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!hasMessages ? (
            <EmptyConversation />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
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
                  onApplyActions={(selected) => handleApplyActions(msg.id, selected)}
                  onDismissActions={() => handleDismissActions(msg.id)}
                  isError={msg.isError}
                />
              ))}

              {/* Thinking Indicator while waiting for AI response */}
              <AnimatePresence>{isLoading && <ThinkingIndicator />}</AnimatePresence>

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </div>

        {/* Input Composer */}
        <div className="shrink-0 border-t border-border bg-surface/90 p-3 backdrop-blur-xs sm:p-4">
          <ChatComposer
            textareaRef={textareaRef}
            value={inputValue}
            onChange={setInputValue}
            onSend={() => handleSend(inputValue)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </PageContainer>
  )
}
