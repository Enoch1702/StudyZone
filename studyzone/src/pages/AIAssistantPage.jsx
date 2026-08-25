import { useRef, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import {
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { motion } from 'motion/react'
import { PageContainer } from '../components/layout/PageContainer'
import {
  ChatMessage,
  ThinkingIndicator,
  QuickPrompts,
  ChatComposer,
  EmptyConversation,
} from '../components/ai/AIStudyForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { sendMessage } from '../services/aiService'
import {
  getConversations,
  createConversation,
  deleteConversation,
  getConversationMessages,
  saveConversationMessage,
  updateMessageMetadata,
  generateConversationTitle,
} from '../services/aiConversationService'
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
import { cn } from '../lib/utils'
import { staggerContainer, staggerItem } from '../lib/motion'

function formatConversationTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * AI Assistant Page with Persistent Chat History & Adaptive Planning.
 */
export default function AIAssistantPage() {
  const { user, profile } = useAuth()
  const location = useLocation()

  // Conversation history list and active conversation
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(true)

  // Delete conversation confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState(null)

  // Local store of user's existing records for duplicate detection & subject linking
  const [existingSubjects, setExistingSubjects] = useState([])
  const [, setExistingTasks] = useState([])
  const [, setExistingDeadlines] = useState([])
  const [, setExistingPlans] = useState([])
  const [analyticsSummary, setAnalyticsSummary] = useState(null)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const initialPromptHandled = useRef(false)

  // Fetch initial workload, analytics, and conversations list
  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    async function loadInitialData() {
      try {
        const [subRes, taskRes, deadRes, planRes, analyticsRes, convRes] = await Promise.all([
          getSubjects(user.id),
          getTasks(user.id),
          getDeadlines(user.id),
          getLearningPlans(user.id),
          fetchLearningAnalyticsData(user.id),
          getConversations(user.id),
        ])

        if (!isMounted) return

        if (subRes.data) setExistingSubjects(subRes.data)
        if (taskRes.data) setExistingTasks(taskRes.data)
        if (deadRes.data) setExistingDeadlines(deadRes.data)
        if (planRes.data) setExistingPlans(planRes.data)

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

        const loadedConvs = convRes.data || []
        setConversations(loadedConvs)

        // If no incoming prompt and we have conversations, load the most recent one
        const incomingPrompt = location.state?.prompt
        if (!incomingPrompt && loadedConvs.length > 0 && !activeConversationId) {
          const firstConv = loadedConvs[0]
          setActiveConversationId(firstConv.id)
          const msgRes = await getConversationMessages(firstConv.id, user.id)
          if (isMounted && msgRes.data) {
            setMessages(
              msgRes.data.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                actions: m.metadata?.actions || [],
                appliedState: m.metadata?.appliedState || null,
                created_at: m.created_at,
              })),
            )
          }
        }
      } catch (err) {
        console.warn('Error loading assistant initial data:', err)
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [user, location.state, activeConversationId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Select / switch active conversation
  const handleSelectConversation = useCallback(
    async (conversationId) => {
      if (!user?.id || conversationId === activeConversationId || isLoading) return

      setActiveConversationId(conversationId)
      setIsLoading(true)

      try {
        const msgRes = await getConversationMessages(conversationId, user.id)
        if (msgRes.data) {
          setMessages(
            msgRes.data.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              actions: m.metadata?.actions || [],
              appliedState: m.metadata?.appliedState || null,
              created_at: m.created_at,
            })),
          )
        }
      } catch (err) {
        console.warn('Error switching conversation:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [activeConversationId, isLoading, user],
  )

  // Start a fresh new chat
  const handleNewChat = useCallback(() => {
    if (isLoading) return
    setActiveConversationId(null)
    setMessages([])
    setInputValue('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [isLoading])

  // Send message handler (persists both user and assistant turns)
  const handleSend = useCallback(
    async (messageText) => {
      const text = (messageText ?? inputValue).trim()

      if (!text) return
      if (isLoading) return
      if (!user?.id) return

      setIsLoading(true)
      setInputValue('')

      let currentConvId = activeConversationId

      try {
        // 1. If starting a new thread, create the conversation first
        if (!currentConvId) {
          const title = generateConversationTitle(text)
          const newConvRes = await createConversation({ userId: user.id, title })
          if (newConvRes.data) {
            currentConvId = newConvRes.data.id
            setActiveConversationId(currentConvId)
            setConversations((prev) => [newConvRes.data, ...prev])
          }
        }

        // 2. Append and persist User message
        const tempUserMsgId = `usr-${Date.now()}`
        const userMsgObj = { role: 'user', content: text, id: tempUserMsgId }
        setMessages((prev) => [...prev, userMsgObj])

        if (currentConvId) {
          const savedUserMsg = await saveConversationMessage({
            conversationId: currentConvId,
            userId: user.id,
            role: 'user',
            content: text,
          })
          if (savedUserMsg.data) {
            userMsgObj.id = savedUserMsg.data.id
          }
        }

        // 3. Build bounded history (last 10 messages) for Gemini context
        const boundedHistory = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))

        // 4. Send request to Edge Function
        const { reply, actions } = await sendMessage({
          message: text,
          history: boundedHistory,
          analyticsSummary,
        })

        const rawActions = Array.isArray(actions) ? actions : []

        // 5. Append and persist Assistant message
        const tempAssistantMsgId = `ast-${Date.now()}`
        const assistantMsgObj = {
          role: 'assistant',
          content: reply,
          actions: rawActions,
          appliedState: null,
          id: tempAssistantMsgId,
        }
        setMessages((prev) => [...prev, assistantMsgObj])

        if (currentConvId) {
          const savedAstMsg = await saveConversationMessage({
            conversationId: currentConvId,
            userId: user.id,
            role: 'assistant',
            content: reply,
            metadata: { actions: rawActions },
          })
          if (savedAstMsg.data) {
            assistantMsgObj.id = savedAstMsg.data.id
          }

          // Update conversation list timestamp order
          setConversations((prev) =>
            prev.map((c) => (c.id === currentConvId ? { ...c, updated_at: new Date().toISOString() } : c)),
          )
        }
      } catch (err) {
        const errorMessage = {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          id: `msg-${Date.now()}-err`,
          isError: true,
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    },
    [activeConversationId, inputValue, isLoading, messages, user, analyticsSummary],
  )

  // Handle incoming prompt passed from Analytics or Dashboard navigation
  useEffect(() => {
    const incomingPrompt = location.state?.prompt
    if (incomingPrompt && !initialPromptHandled.current && user) {
      initialPromptHandled.current = true
      try {
        window.history.replaceState({}, document.title)
      } catch {
        // ignore
      }
      handleSend(incomingPrompt)
    }
  }, [location.state, user, handleSend])

  // Action proposal approval handler
  const handleApplyActions = useCallback(
    async (messageId, selectedActions) => {
      if (!user?.id) throw new Error('You must be logged in to apply actions.')

      const res = await executeApprovedActions({
        userId: user.id,
        actions: selectedActions,
      })

      if (res.successCount > 0) {
        const appliedState = { status: 'applied', count: res.successCount }

        // Update local state
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, appliedState } : msg)),
        )

        // Persist applied metadata to database
        const targetMsg = messages.find((m) => m.id === messageId)
        if (targetMsg) {
          await updateMessageMetadata({
            messageId,
            userId: user.id,
            metadata: {
              actions: targetMsg.actions,
              appliedState,
            },
          })
        }

        // Refresh workload caches
        const [taskRes, deadRes, planRes] = await Promise.all([
          getTasks(user.id),
          getDeadlines(user.id),
          getLearningPlans(user.id),
        ])
        if (taskRes.data) setExistingTasks(taskRes.data)
        if (deadRes.data) setExistingDeadlines(deadRes.data)
        if (planRes.data) setExistingPlans(planRes.data)
      }

      return res
    },
    [user, messages],
  )

  // Action proposal dismiss handler
  const handleDismissActions = useCallback(
    async (messageId) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, actions: [], appliedState: { status: 'dismissed' } } : msg)),
      )

      if (user?.id) {
        await updateMessageMetadata({
          messageId,
          userId: user.id,
          metadata: { actions: [], appliedState: { status: 'dismissed' } },
        })
      }
    },
    [user],
  )

  // Delete conversation handler
  async function confirmDeleteConversation() {
    if (!conversationToDelete || !user?.id) return

    const idToDelete = conversationToDelete.id
    setConversations((prev) => prev.filter((c) => c.id !== idToDelete))
    setDeleteConfirmOpen(false)
    setConversationToDelete(null)

    await deleteConversation({ conversationId: idToDelete, userId: user.id })

    if (activeConversationId === idToDelete) {
      handleNewChat()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <PageContainer width="wide" className="flex h-[calc(100vh-3.5rem)] flex-col p-3 sm:p-5">
      {/* Top Header & Adaptive Prompts */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-3 shrink-0"
      >
        <div className="flex items-center justify-between">
          <motion.div variants={staggerItem} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                AI Study Assistant & Planner
              </h1>
              <p className="text-[11px] text-muted hidden sm:block">
                Conversational study planning, revision schedules, and action proposals backed by real data.
              </p>
            </div>
          </motion.div>

          <button
            type="button"
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted hover:text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Toggle conversation history"
          >
            {isHistoryOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeft className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isHistoryOpen ? 'Hide History' : 'Show History'}</span>
          </button>
        </div>

        {/* Adaptive Quick Prompts */}
        <motion.div variants={staggerItem} className="mt-2.5">
          <QuickPrompts
            learnerType={profile?.learner_type}
            onSelect={(prompt) => {
              if (!isLoading) handleSend(prompt)
            }}
            disabled={isLoading}
          />
        </motion.div>
      </motion.div>

      {/* Main Workspace: History Drawer + Chat Area */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* Conversation History Sidebar */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface"
            >
              {/* New Chat Button */}
              <div className="p-3 border-b border-border/70">
                <button
                  type="button"
                  onClick={handleNewChat}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent/90 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* History List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-transparent">
                {conversations.length === 0 ? (
                  <div className="py-8 text-center px-3">
                    <MessageSquare className="h-5 w-5 mx-auto text-muted/60 mb-1.5" />
                    <p className="text-xs font-semibold text-muted">No saved chats</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Your study conversations will be saved here.</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={cn(
                          'group flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all cursor-pointer',
                          isActive
                            ? 'bg-accent/15 border border-accent/40 text-foreground'
                            : 'hover:bg-surface-raised/70 text-foreground/80 border border-transparent',
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-1">
                          <p className="text-xs font-medium truncate text-foreground">{conv.title}</p>
                          <span className="text-[9px] text-muted-foreground">{formatConversationTime(conv.updated_at)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConversationToDelete(conv)
                            setDeleteConfirmOpen(true)
                          }}
                          className="rounded p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-surface-raised transition-all"
                          aria-label="Delete chat"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Active Conversation Chat Window */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5">
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
                    appliedState={msg.appliedState}
                    onApplyActions={(selected) => handleApplyActions(msg.id, selected)}
                    onDismissActions={() => handleDismissActions(msg.id)}
                    isError={msg.isError}
                  />
                ))}

                <AnimatePresence>{isLoading && <ThinkingIndicator />}</AnimatePresence>

                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </div>

          {/* Input Composer */}
          <div className="shrink-0 border-t border-border bg-surface/95 p-3 backdrop-blur-xs sm:p-4">
            <ChatComposer
              textareaRef={textareaRef}
              value={inputValue}
              onChange={setInputValue}
              onSend={() => handleSend(inputValue)}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Delete Conversation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Conversation"
        description={`Are you sure you want to delete "${conversationToDelete?.title}"? This conversation and its saved messages will be permanently removed.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeleteConversation}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setConversationToDelete(null)
        }}
      />
    </PageContainer>
  )
}
