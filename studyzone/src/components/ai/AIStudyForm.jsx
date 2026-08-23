import { useState } from 'react'
import { motion } from 'motion/react'
import { Bot, User, AlertCircle, Check, Copy, Square, CheckSquare } from 'lucide-react'
import { AIActionProposal } from './AIActionProposal'
import { cn } from '../../lib/utils'
import { fadeUp, staggerItem } from '../../lib/motion'

// ---------------------------------------------------------------------------
// ChatMessage
// ---------------------------------------------------------------------------

/**
 * Renders a single conversation message bubble with structured formatting,
 * 1-click copy support, and optional interactive action proposals.
 */
export function ChatMessage({
  role,
  content,
  actions = [],
  subjects = [],
  existingTasks = [],
  existingDeadlines = [],
  appliedState = null,
  onApplyActions,
  onDismissActions,
  isError = false,
}) {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore copy error
    }
  }

  const hasActions = !isUser && !isError && Array.isArray(actions) && actions.length > 0

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        'group flex gap-3',
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
        ) : isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Bubble container */}
      <div className="flex max-w-[88%] flex-col gap-1 sm:max-w-[82%]">
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-2xs',
            isUser
              ? 'rounded-tr-sm bg-accent text-white'
              : isError
                ? 'rounded-tl-sm bg-danger/10 text-danger border border-danger/20'
                : 'rounded-tl-sm bg-surface-raised border border-border text-foreground',
          )}
        >
          <FormattedMessage content={content} />
        </div>

        {/* Copy action (assistant only) */}
        {!isUser && !isError && content && (
          <div className="flex items-center justify-end px-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-foreground transition-colors p-0.5 rounded"
              title="Copy response to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-accent" />
                  <span className="text-accent">Copied plan</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Proposed StudyZone Actions (interactive user-approved review) */}
        {hasActions && (
          <AIActionProposal
            actions={actions}
            subjects={subjects}
            existingTasks={existingTasks}
            existingDeadlines={existingDeadlines}
            appliedState={appliedState}
            onApply={onApplyActions}
            onDismiss={onDismissActions}
          />
        )}
      </div>
    </motion.div>
  )
}

/**
 * Renders message content with markdown formatting, headings,
 * bold inline elements, bullet lists, numbered lists, and checklists.
 */
function FormattedMessage({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip blank lines
    if (line.trim() === '') {
      i++
      continue
    }

    // Checkbox checklist items ([ ], [x], - [ ], - [x], □, ☑)
    if (line.match(/^[-*•]?\s*(\[[ xX]\]|□|☑)\s/)) {
      const checklistItems = []
      while (i < lines.length && lines[i].match(/^[-*•]?\s*(\[[ xX]\]|□|☑)\s/)) {
        const raw = lines[i]
        const isChecked = Boolean(raw.match(/\[[xX]\]|☑/))
        const text = raw.replace(/^[-*•]?\s*(\[[ xX]\]|□|☑)\s*/, '').trim()
        checklistItems.push({ text, isChecked })
        i++
      }
      elements.push(
        <div key={`chk-${i}`} className="my-2 space-y-1.5 rounded-lg bg-surface/60 p-2.5 border border-border/50">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
              <div className="mt-0.5 shrink-0 text-accent">
                {item.isChecked ? (
                  <CheckSquare className="h-3.5 w-3.5" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <span className={cn(item.isChecked ? 'line-through text-muted' : 'text-foreground')}>
                {renderInlineMarkdown(item.text)}
              </span>
            </div>
          ))}
        </div>,
      )
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
        <ul key={`ul-${i}`} className="mt-1.5 space-y-1 list-none pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-xs sm:text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
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
        <ol key={`ol-${i}`} className="mt-1.5 space-y-1 list-none pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-xs sm:text-sm">
              <span className="shrink-0 text-xs font-semibold text-accent mt-0.5">{idx + 1}.</span>
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>,
      )
      continue
    }

    // Main Heading (# )
    if (line.startsWith('# ')) {
      elements.push(
        <h3 key={`h1-${i}`} className="mt-3 text-base font-bold tracking-tight text-foreground first:mt-0">
          {renderInlineMarkdown(line.replace('# ', ''))}
        </h3>,
      )
      i++
      continue
    }

    // Section Heading (## )
    if (line.startsWith('## ')) {
      elements.push(
        <h4 key={`h2-${i}`} className="mt-2.5 text-sm font-semibold tracking-tight text-foreground first:mt-0">
          {renderInlineMarkdown(line.replace('## ', ''))}
        </h4>,
      )
      i++
      continue
    }

    // Sub Heading (### )
    if (line.startsWith('### ')) {
      elements.push(
        <h5 key={`h3-${i}`} className="mt-2 text-xs sm:text-sm font-semibold text-foreground first:mt-0">
          {renderInlineMarkdown(line.replace('### ', ''))}
        </h5>,
      )
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className={cn('text-xs sm:text-sm leading-relaxed', elements.length > 0 ? 'mt-2' : '')}>
        {renderInlineMarkdown(line)}
      </p>,
    )
    i++
  }

  return <>{elements}</>
}

/**
 * Renders inline markdown: `code`, **bold**, and *italic*.
 */
function renderInlineMarkdown(text) {
  if (!text) return null

  // Split on code, bold, and italic patterns
  const parts = text.split(/(`[^`]+`|[*][*][^*]+[*][*]|[*][^*]+[*])/g)

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="rounded bg-surface px-1.5 py-0.5 text-xs font-mono text-accent border border-border/60">
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
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      )
    }
    return part
  })
}

// ---------------------------------------------------------------------------
// ThinkingIndicator
// ---------------------------------------------------------------------------

/**
 * Animated "thinking" indicator shown while the AI is generating a response.
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised border border-border text-muted">
        <Bot className="h-4 w-4" />
      </div>

      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-surface-raised border border-border px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent"
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
// Adaptive QuickPrompts
// ---------------------------------------------------------------------------

/**
 * Returns contextual quick prompts based on learner category.
 */
function getAdaptivePrompts(learnerType) {
  switch (learnerType) {
    case 'placement':
      return [
        { icon: '✨', label: 'What should I study today?', id: 'qp-today' },
        { icon: '💼', label: 'Plan my placement preparation', id: 'qp-placement' },
        { icon: '🎯', label: 'Help me prioritize my tasks', id: 'qp-prioritize' },
        { icon: '🔄', label: 'What should I revise first?', id: 'qp-revise' },
        { icon: '📋', label: 'Create a DSA & coding checklist', id: 'qp-checklist' },
      ]
    case 'competitive_exam':
      return [
        { icon: '✨', label: 'What should I study today?', id: 'qp-today' },
        { icon: '🏆', label: 'Plan my exam syllabus schedule', id: 'qp-exam-plan' },
        { icon: '🎯', label: 'Help me prioritize my tasks', id: 'qp-prioritize' },
        { icon: '🔄', label: 'What should I revise first?', id: 'qp-revise' },
        { icon: '📋', label: 'Generate a high-yield checklist', id: 'qp-checklist' },
      ]
    case 'skill_dev':
      return [
        { icon: '✨', label: 'What should I study today?', id: 'qp-today' },
        { icon: '💻', label: 'Build my skill learning roadmap', id: 'qp-skill-plan' },
        { icon: '🎯', label: 'Help me prioritize my tasks', id: 'qp-prioritize' },
        { icon: '🔄', label: 'What should I revise first?', id: 'qp-revise' },
        { icon: '📋', label: 'Create a project checklist', id: 'qp-checklist' },
      ]
    case 'college':
    case 'school':
    default:
      return [
        { icon: '✨', label: 'What should I study today?', id: 'qp-today' },
        { icon: '📅', label: 'Create a study plan for this week', id: 'qp-plan' },
        { icon: '🎯', label: 'Help me prioritize my tasks', id: 'qp-prioritize' },
        { icon: '🔄', label: 'What should I revise first?', id: 'qp-revise' },
        { icon: '📋', label: 'Create a study checklist', id: 'qp-checklist' },
      ]
  }
}

/**
 * Row of quick-action prompt chips adapted to the learner category.
 *
 * @param {Object} props
 * @param {string|null} [props.learnerType] - Learner category
 * @param {(message: string) => void} props.onSelect - Called with prompt text
 * @param {boolean} props.disabled - Disable during loading
 */
export function QuickPrompts({ learnerType, onSelect, disabled }) {
  const prompts = getAdaptivePrompts(learnerType)

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-2"
    >
      {prompts.map(({ icon, label, id }) => (
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
        placeholder="Ask anything about your study plans, tasks, or revision…"
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
      <p className="text-sm font-medium text-foreground">AI Study Planner & Coach</p>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">
        I can analyze your learning profile, active tasks, upcoming deadlines, and study history to build daily study plans, revision queues, and checklists.
      </p>
    </motion.div>
  )
}

export { EmptyConversation as AIStudyFormHeader }
export { ChatComposer as AIStudyForm }
