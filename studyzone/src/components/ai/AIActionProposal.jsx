import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertCircle,
  CalendarDays,
  CheckSquare,
  CheckCircle2,
  Clock,
  Compass,
  Edit2,
  ListTodo,
  Milestone,
  Plus,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Badge } from '../ui/Badge'
import { isDuplicateAction } from '../../services/aiActionService'
import { formatDate, cn } from '../../lib/utils'
import { fadeUp, staggerContainer, staggerItem } from '../../lib/motion'

/**
 * Interactive review component for AI-generated action proposals
 * (Tasks, Deadlines, and Learning Plans).
 * Allows the user to select/deselect, edit, remove items, and explicitly confirm before saving to database.
 */
export function AIActionProposal({
  actions = [],
  subjects = [],
  existingTasks = [],
  existingDeadlines = [],
  existingPlans = [],
  appliedState = null,
  onApply,
  onDismiss,
}) {
  const [items, setItems] = useState(() =>
    actions.map((act) => ({
      ...act,
      selected: true,
      isEditing: false,
    })),
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!actions || actions.length === 0) return null

  // If already applied successfully
  if (appliedState?.status === 'applied') {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-3.5 sm:p-4"
      >
        <div className="flex items-center gap-2.5 text-xs text-accent font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Added {appliedState.count} item{appliedState.count !== 1 ? 's' : ''} to your StudyZone! View them in your Plans, Tasks, or Deadlines.
          </span>
        </div>
      </motion.div>
    )
  }

  // Count active selections
  const selectedItems = items.filter((it) => it.selected)
  const selectedCount = selectedItems.length

  function handleToggleSelect(id) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    )
  }

  function handleToggleEdit(id) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isEditing: !item.isEditing } : item)),
    )
  }

  function handleRemoveItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function handleUpdateField(id, field, value) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  function handleRemovePlanMilestone(itemId, milestoneIndex) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId || !Array.isArray(item.milestones)) return item
        const updated = item.milestones.filter((_, idx) => idx !== milestoneIndex)
        return { ...item, milestones: updated }
      }),
    )
  }

  async function handleConfirm() {
    if (selectedCount === 0 || isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await onApply?.(selectedItems)
      if (res?.failedCount > 0 && res?.successCount === 0) {
        setErrorMessage('Failed to add proposed items. Please try again.')
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mt-3 overflow-hidden rounded-xl border border-ai-accent/30 bg-surface shadow-md transition-all"
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-border/80 bg-ai-muted/15 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ai-muted text-ai-accent">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground">
              Proposed StudyZone Actions
            </span>
            <p className="text-[11px] text-muted">
              Review and customize before adding to your workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-ai-accent">
            {selectedCount} of {items.length} selected
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss action proposals"
              className="rounded p-1 text-muted hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Items List */}
      <div className="p-3 sm:p-4 space-y-2.5 max-h-[400px] overflow-y-auto">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
          <AnimatePresence>
            {items.map((item) => {
              const isTask = item.type === 'create_task'
              const isPlan = item.type === 'create_learning_plan'
              const isDuplicate = isDuplicateAction(item, existingTasks, existingDeadlines, existingPlans)

              return (
                <motion.div
                  key={item.id}
                  variants={staggerItem}
                  layout
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                  className={cn(
                    'rounded-lg border p-3 transition-all duration-150',
                    item.selected
                      ? 'border-border bg-surface shadow-2xs'
                      : 'border-border/40 bg-surface-raised/40 opacity-60',
                  )}
                >
                  {/* Top Bar: checkbox, type badge, duplicate alert, actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        aria-label={item.selected ? 'Deselect action' : 'Select action'}
                        className="mt-0.5 text-accent shrink-0 hover:scale-105 transition-transform"
                      >
                        {item.selected ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4 text-muted" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                              isPlan
                                ? 'bg-accent/15 text-accent border border-accent/30'
                                : isTask
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'bg-warning/10 text-warning border border-warning/20',
                            )}
                          >
                            {isPlan ? (
                              <Compass className="h-2.5 w-2.5" />
                            ) : isTask ? (
                              <ListTodo className="h-2.5 w-2.5" />
                            ) : (
                              <CalendarDays className="h-2.5 w-2.5" />
                            )}
                            {isPlan ? 'Learning Plan' : isTask ? 'Task' : 'Deadline'}
                          </span>

                          {isTask && item.priority && (
                            <Badge variant={item.priority} className="text-[10px] py-0 px-1.5">
                              {item.priority}
                            </Badge>
                          )}

                          {!isTask && !isPlan && item.deadline_type && (
                            <Badge variant="default" className="text-[10px] py-0 px-1.5 capitalize">
                              {item.deadline_type}
                            </Badge>
                          )}

                          {item.subject_name && (
                            <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-muted border border-border/60">
                              {item.subject_name}
                            </span>
                          )}

                          {isDuplicate && (
                            <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning border border-warning/30">
                              Similar item exists
                            </span>
                          )}
                        </div>

                        {/* Title & Description or Edit form */}
                        {item.isEditing ? (
                          <div className="space-y-2 mt-2 pt-1 border-t border-border/60">
                            <div>
                              <label className="block text-[10px] font-medium text-muted mb-0.5">Title</label>
                              <Input
                                value={item.title}
                                onChange={(e) => handleUpdateField(item.id, 'title', e.target.value)}
                                className="h-8 text-xs"
                                placeholder="Item title"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-medium text-muted mb-0.5">Description</label>
                              <Input
                                value={item.description || ''}
                                onChange={(e) => handleUpdateField(item.id, 'description', e.target.value)}
                                className="h-8 text-xs"
                                placeholder="Description (optional)"
                              />
                            </div>

                            {!isPlan && (
                              <div className="grid grid-cols-2 gap-2">
                                {isTask ? (
                                  <div>
                                    <label className="block text-[10px] font-medium text-muted mb-0.5">Priority</label>
                                    <select
                                      value={item.priority || 'medium'}
                                      onChange={(e) => handleUpdateField(item.id, 'priority', e.target.value)}
                                      className="w-full h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-accent focus:outline-none"
                                    >
                                      <option value="low">Low</option>
                                      <option value="medium">Medium</option>
                                      <option value="high">High</option>
                                      <option value="urgent">Urgent</option>
                                    </select>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-[10px] font-medium text-muted mb-0.5">Type</label>
                                    <select
                                      value={item.deadline_type || 'assignment'}
                                      onChange={(e) => handleUpdateField(item.id, 'deadline_type', e.target.value)}
                                      className="w-full h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-accent focus:outline-none"
                                    >
                                      <option value="exam">Exam</option>
                                      <option value="assignment">Assignment</option>
                                      <option value="project">Project</option>
                                      <option value="quiz">Quiz</option>
                                      <option value="presentation">Presentation</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <label className="block text-[10px] font-medium text-muted mb-0.5">Due Date</label>
                                  <Input
                                    type="date"
                                    value={item.due_date ? item.due_date.slice(0, 10) : item.target_date || ''}
                                    onChange={(e) =>
                                      handleUpdateField(
                                        item.id,
                                        isPlan ? 'target_date' : 'due_date',
                                        e.target.value ? new Date(e.target.value).toISOString() : null,
                                      )
                                    }
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            )}

                            {!isPlan && subjects.length > 0 && (
                              <div>
                                <label className="block text-[10px] font-medium text-muted mb-0.5">Subject</label>
                                <select
                                  value={item.subject_id || ''}
                                  onChange={(e) => {
                                    const subId = e.target.value || null
                                    const found = subjects.find((s) => s.id === subId)
                                    handleUpdateField(item.id, 'subject_id', subId)
                                    handleUpdateField(item.id, 'subject_name', found ? found.name : null)
                                  }}
                                  className="w-full h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-accent focus:outline-none"
                                >
                                  <option value="">No subject</option>
                                  {subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                      {sub.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="flex justify-end pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => handleToggleEdit(item.id)}
                                className="h-6 text-[11px] px-2"
                              >
                                Done editing
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-foreground leading-tight">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="mt-0.5 text-[11px] text-muted leading-tight line-clamp-2">
                                {item.description}
                              </p>
                            )}

                            {/* Plan Milestones List */}
                            {isPlan && Array.isArray(item.milestones) && item.milestones.length > 0 && (
                              <div className="mt-2 space-y-1 rounded-md bg-surface-raised/80 p-2 border border-border/60">
                                <span className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                                  Milestones ({item.milestones.length})
                                </span>
                                {item.milestones.map((m, mIdx) => (
                                  <div key={mIdx} className="flex items-center justify-between gap-1 text-[11px] text-foreground">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Milestone className="h-3 w-3 text-accent shrink-0" />
                                      <span className="truncate">{m.title}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePlanMilestone(item.id, mIdx)}
                                      title="Remove milestone"
                                      className="text-muted hover:text-danger p-0.5"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Meta row */}
                            <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                              {(item.due_date || item.target_date) && (
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  Target {formatDate(item.due_date || item.target_date)}
                                </span>
                              )}
                              {isTask && item.estimated_minutes && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  ~{item.estimated_minutes} min
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit & Delete actions */}
                    {!item.isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleEdit(item.id)}
                          aria-label="Edit proposed action"
                          title="Edit"
                          className="rounded p-1 text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label="Remove proposed action"
                          title="Remove"
                          className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="px-4 py-2 bg-danger/10 border-t border-danger/20 text-danger text-xs flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Confirmation Action Bar */}
      <div className="flex items-center justify-between border-t border-border/80 bg-surface px-4 py-2.5 sm:px-5">
        <span className="text-[11px] text-muted-foreground">
          Safe execution · Creates items via your account
        </span>

        <div className="flex items-center gap-2">
          {onDismiss && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              disabled={isSubmitting}
              className="text-xs h-8 text-muted"
            >
              Dismiss
            </Button>
          )}

          <Button
            type="button"
            variant="ai"
            size="sm"
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isSubmitting}
            className="text-xs h-8 gap-1.5"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Adding to StudyZone...</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Selected ({selectedCount})</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}