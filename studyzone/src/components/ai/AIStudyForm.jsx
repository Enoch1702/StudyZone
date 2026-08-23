import { motion } from 'motion/react'
import { Bot, User, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { fadeUp, staggerItem } from '../../lib/motion'

// ---------------------------------------------------------------------------
// ChatMessage
// ---------------------------------------------------------------------------

/**
 * Renders a single conversation message bubble.
 * Visually distinct for user vs assistant roles.
 */
export function ChatMessage({ role, content, isError = false }) {
  const isUser = role === 'user'

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-accent/20 text-accent'
            : isError
              ? 'bg-danger/15 text-danger'
              : 'bg-surface-raised border border-border text-muted',
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          isError
            ? <AlertCircle className="h-4 w-4" />
            : <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-accent text-white'
            : isError
              ? 'rounded-tl-sm bg-danger/10 text-danger border border-danger/20'
              : 'rounded-tl-sm bg-surface-raised border border-border text-foreground',
        )}
      >
        <FormattedMessage content={content} />
      </div>
    </motion.div>
  )
}

/**
 * Renders message content with basic markdown-style formatting.
 * Handles bold (**text**), bullet lists, and numbered lists.
 */
function FormattedMessage({ content }) {
  if (!content) return null

  // Split into paragraphs/blocks
  const lines = content.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip blank lines (used as separators)
    if (line.trim() === '') {
      i++
      continue
    }

    // Bullet list item
    if (line.match(/^[-*•]\s/)) {
      const listItems = []
      while (i < lines.length && lines[i].match(/^[-*•]\s/)) {
        listItems.push(lines[i].replace(/^[-*•]\s/, '').trim())
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="mt-1.5 space-y-1 list-none">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>,
      )
      continue
    }

    // Numbered list item
    if (line.match(/^\d+\.\s/)) {
      const listItems = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        listItems.push(lines[i].replace(/^\d+\.\s/, '').trim())
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="mt-1.5 space-y-1 list-none">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="shrink-0 text-xs font-medium opacity-50 mt-0.5">{idx + 1}.</span>
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>,
      )
      continue
    }

    // Heading (###)
    if (line.startsWith('### ')) {
      elements.push(
        <p key={`h-${i}`} className="mt-2 font-semibold text-foreground">
          {line.replace('### ', '')}
        </p>,
      )
      i++
      continue
    }

    // Heading (##)
    if (line.startsWith('## ')) {
      elements.push(
        <p key={`h2-${i}`} className="mt-2 font-semibold text-foreground">
          {line.replace('## ', '')}
        </p>,
      )
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className={elements.length > 0 ? 'mt-2' : ''}>
        {renderInlineMarkdown(line)}
      </p>,
    )
    i++
  }

  return <>{elements}</>
}

/**
 * Renders inline markdown: **bold** and *italic*
 */
function renderInlineMarkdown(text) {
  if (!text) return null

  // Split on **bold** and *italic* patterns
  const parts = text.split(/([*][*][^*]+[*][*]|[*][^*]+[*])/g)

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

// ---------------------------------------------------------------------------
// ThinkingIndicator
// ---------------------------------------------------------------------------

/**
 * Animated "thinking" indicator shown while the AI is generating a response.
 * Uses subtle pulsing dots — not distracting, clearly communicates processing.
 */
export function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3"
    >
      {/* Bot avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised border border-border text-muted">
        <Bot className="h-4 w-4" />
      </div>

      {/* Dots */}
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-surface-raised border border-border px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// QuickPrompts
// ---------------------------------------------------------------------------

const QUICK_PROMPTS = [
  { icon: '✨', label: 'What should I study today?', id: 'qp-today' },
  { icon: '🎯', label: 'Help me prioritize my tasks', id: 'qp-prioritize' },
  { icon: '📅', label: 'What deadlines are coming up?', id: 'qp-deadlines' },
  { icon: '📊', label: 'Summarize my current workload', id: 'qp-workload' },
]

/**
 * Row of quick-action prompt chips.
 * Clicking a chip sends the message immediately.
 *
 * @param {Object} props
 * @param {(message: string) => void} props.onSelect - Called with the prompt text
 * @param {boolean} props.disabled - Disable during loading
 */
export function QuickPrompts({ onSelect, disabled }) {
  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-2"
    >
      {QUICK_PROMPTS.map(({ icon, label, id }) => (
        <button
          key={id}
          id={id}
          onClick={() => onSelect(label)}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised',
            'px-3.5 py-1.5 text-xs font-medium text-muted',
            'transition-all duration-150',
            'hover:border-accent/40 hover:bg-accent/8 hover:text-foreground',
            'active:scale-[0.96]',
            'disabled:pointer-events-none disabled:opacity-40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          )}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// ChatComposer
// ---------------------------------------------------------------------------

/**
 * Message input area with send button.
 * - Enter sends the message
 * - Shift+Enter inserts a new line
 * - Auto-grows with content
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {(v: string) => void} props.onChange
 * @param {() => void} props.onSend
 * @param {boolean} props.isLoading
 * @param {import('react').RefObject} [props.textareaRef]
 */
export function ChatComposer({ value, onChange, onSend, isLoading, textareaRef }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim()) {
        onSend()
      }
    }
  }

  const canSend = !isLoading && value.trim().length > 0

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-raised p-2 transition-all duration-150 focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10">
      <textarea
        ref={textareaRef}
        id="ai-message-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your studies…"
        disabled={isLoading}
        rows={1}
        aria-label="Message input"
        className={cn(
          'flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'max-h-32 overflow-y-auto',
        )}
        style={{ fieldSizing: 'content' }}
      />

      <button
        id="ai-send-button"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          'transition-all duration-150',
          canSend
            ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.93]'
            : 'bg-surface text-muted cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        )}
      >
        <SendIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/** Minimal send arrow icon */
function SendIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1.146 1.146a.5.5 0 0 1 .638-.057l12 7a.5.5 0 0 1 0 .854l-12 7a.5.5 0 0 1-.724-.554l1.5-5.5A.5.5 0 0 1 3 9.5h4a.5.5 0 0 0 0-1H3a.5.5 0 0 1-.48-.354l-1.5-5.5a.5.5 0 0 1 .126-.5z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// EmptyConversation
// ---------------------------------------------------------------------------

/**
 * Empty state displayed before the first message is sent.
 */
export function EmptyConversation() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/8 mb-4">
        <Bot className="h-7 w-7 text-accent" />
      </div>
      <p className="text-sm font-medium text-foreground">Ask me anything</p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted">
        I can see your learning profile, subjects, tasks, deadlines, and study history — use the quick prompts
        above or ask any question.
      </p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Legacy exports (kept to avoid breaking any residual import)
// AIStudyForm is replaced but export is preserved for safety
// ---------------------------------------------------------------------------
export { EmptyConversation as AIStudyFormHeader }
export { ChatComposer as AIStudyForm }
