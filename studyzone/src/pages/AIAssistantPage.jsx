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
import { useAuth } from '../context/useAuth'
import { fadeUp, staggerContainer, staggerItem } from '../lib/motion'

// ---------------------------------------------------------------------------
// AI Assistant Page
// ---------------------------------------------------------------------------

/**
 * The main AI Assistant page.
 *
 * State management:
 * - Conversation history is kept client-side only (clears on page refresh).
 * - Only the last 10 turns are forwarded to the Edge Function per request.
 * - Loading state prevents duplicate submissions.
 *
 * Security:
 * - No API keys in this file.
 * - User session JWT is automatically attached by the Supabase client.
 * - User identity is verified server-side in the Edge Function.
 */
export default function AIAssistantPage() {
  const { user, profile } = useAuth()

  // Conversation state — client-side only, no persistence
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

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
      if (!user) return // Protected route handles auth; this is a safety guard

      // Append user message to conversation
      const userMessage = { role: 'user', content: text, id: `msg-${Date.now()}` }
      setMessages((prev) => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)

      // Build history from current messages (before appending the new one)
      const history = messages.map((m) => ({ role: m.role, content: m.content }))

      try {
        const { reply } = await sendMessage({ message: text, history })

        const assistantMessage = {
          role: 'assistant',
          content: reply,
          id: `msg-${Date.now()}-reply`,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        // On failure: preserve user's message so they can retry
        // Show error as a failed assistant message
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
          <div className="flex-1 min-h-[360px] max-h-[520px] overflow-y-auto p-4 sm:p-5">
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
              Enter to send · Shift + Enter for new line · Advisory only — AI cannot modify your data
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
    icon: '📋',
    title: 'Checklists & Revision',
    description: 'Generate targeted study checklists and revision roadmaps for your key focus areas.',
  },
]
