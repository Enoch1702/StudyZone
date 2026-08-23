import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckSquare, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { modalBackdrop, modalPanel } from '../../lib/motion'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

/**
 * TaskFormContent is keyed to task?.id so React unmounts/remounts it
 * when switching between create (key='new-task') and edit (key=task.id),
 * giving each form clean initial state.
 */
function TaskFormContent({ task, subjects, onSave, onClose, loading }) {
  const isEditing = Boolean(task)

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [status, setStatus] = useState(task?.status || 'pending')
  const [subjectId, setSubjectId] = useState(task?.subject_id || '')
  // due_date is stored as TIMESTAMPTZ — convert to YYYY-MM-DD for the date input
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split('T')[0] : '',
  )
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task?.estimated_minutes != null ? String(task.estimated_minutes) : '',
  )
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError('Please enter a task title.')
      return
    }

    if (estimatedMinutes !== '') {
      const mins = Number(estimatedMinutes)
      if (!Number.isInteger(mins) || mins < 0) {
        setError('Estimated minutes must be a positive whole number (e.g. 30, 90).')
        return
      }
    }

    await onSave({
      title: cleanTitle,
      description: description.trim(),
      priority,
      status,
      subjectId: subjectId || null,
      // Convert local date string to ISO for Supabase TIMESTAMPTZ
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      estimatedMinutes: estimatedMinutes !== '' ? Number(estimatedMinutes) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="task-title" className="block text-xs font-medium text-foreground">
          Task Title <span className="text-danger">*</span>
        </label>
        <Input
          id="task-title"
          type="text"
          placeholder="e.g. Complete problem set on eigenvalues"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          autoFocus
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="task-description" className="block text-xs font-medium text-muted">
          Description <span className="text-[11px] text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="task-description"
          placeholder="Additional notes, references, or context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>

      {/* Priority & Status row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="task-priority" className="block text-xs font-medium text-muted">
            Priority
          </label>
          <Select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={loading}
            className="w-full"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-status" className="block text-xs font-medium text-muted">
            Status
          </label>
          <Select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading}
            className="w-full"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <label htmlFor="task-subject" className="block text-xs font-medium text-muted">
          Subject <span className="text-[11px] text-muted-foreground">(optional)</span>
        </label>
        <Select
          id="task-subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={loading}
          className="w-full"
        >
          <option value="">No subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Due Date & Estimated Minutes row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="task-due-date" className="block text-xs font-medium text-muted">
            Due Date <span className="text-[11px] text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-est-minutes" className="block text-xs font-medium text-muted">
            Est. Minutes <span className="text-[11px] text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="task-est-minutes"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 60"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={loading} className="gap-2">
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>{isEditing ? 'Saving...' : 'Creating...'}</span>
            </>
          ) : (
            <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
          )}
        </Button>
      </div>
    </form>
  )
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  task = null,
  subjects = [],
  loading = false,
}) {
  const isEditing = Boolean(task)

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => { if (!loading) onClose() }}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-xl border border-border bg-surface shadow-2xl"
            variants={modalPanel}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-accent/10">
                  <CheckSquare className="h-4 w-4 text-accent" />
                </div>
                <h2 id="task-modal-title" className="text-base font-semibold text-foreground">
                  {isEditing ? 'Edit Task' : 'Add New Task'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close dialog"
                className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form body — keyed so state resets when switching create↔edit */}
            <TaskFormContent
              key={task?.id || 'new-task'}
              task={task}
              subjects={subjects}
              onSave={onSave}
              onClose={onClose}
              loading={loading}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
