import { useState, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'

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
function TaskFormContent({
  task,
  subjects = [],
  plans = [],
  milestones = [],
  onSave,
  onClose,
  loading,
}) {
  const isEditing = Boolean(task)

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [status, setStatus] = useState(task?.status || 'pending')
  const [subjectId, setSubjectId] = useState(task?.subject_id || '')
  const [planId, setPlanId] = useState(task?.plan_id || '')
  const [milestoneId, setMilestoneId] = useState(task?.milestone_id || '')
  // due_date is stored as TIMESTAMPTZ — convert to YYYY-MM-DD for the date input
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split('T')[0] : '',
  )
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task?.estimated_minutes != null ? String(task.estimated_minutes) : '',
  )
  const [error, setError] = useState('')

  // Filter milestones based on selected plan
  const availableMilestones = useMemo(() => {
    if (!planId) return milestones
    return milestones.filter((m) => m.plan_id === planId)
  }, [planId, milestones])

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
      planId: planId || null,
      milestoneId: milestoneId || null,
      // Convert local date string to ISO for Supabase TIMESTAMPTZ
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      estimatedMinutes: estimatedMinutes !== '' ? Number(estimatedMinutes) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Learning Plan & Milestone (Optional) */}
      {(plans.length > 0 || milestones.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="task-plan" className="block text-xs font-medium text-muted">
              Learning Plan <span className="text-[11px] text-muted-foreground">(optional)</span>
            </label>
            <Select
              id="task-plan"
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value)
                setMilestoneId('')
              }}
              disabled={loading}
              className="w-full"
            >
              <option value="">No plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="task-milestone" className="block text-xs font-medium text-muted">
              Milestone <span className="text-[11px] text-muted-foreground">(optional)</span>
            </label>
            <Select
              id="task-milestone"
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              disabled={loading || availableMilestones.length === 0}
              className="w-full"
            >
              <option value="">No milestone</option>
              {availableMilestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

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
          className="text-xs"
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={loading} className="text-xs">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <LoadingSpinner size="sm" />
              {isEditing ? 'Saving...' : 'Creating...'}
            </span>
          ) : isEditing ? (
            'Save Changes'
          ) : (
            'Create Task'
          )}
        </Button>
      </div>
    </form>
  )
}

/**
 * TaskModal — Create or edit a task.
 *
 * @param {boolean} open - Whether the modal is visible
 * @param {Function} onClose - Called when modal is dismissed
 * @param {Object|null} task - Task object to edit, or null to create new
 * @param {Array} subjects - List of subjects for the subject dropdown
 * @param {Array} [plans] - List of learning plans
 * @param {Array} [milestones] - List of learning milestones
 * @param {Function} onSave - Async callback called with form payload on submit
 * @param {boolean} [loading=false] - External loading state
 */
export function TaskModal({
  open,
  isOpen,
  onClose,
  task,
  subjects = [],
  plans = [],
  milestones = [],
  onSave,
  loading = false,
}) {
  const isModalOpen = Boolean(open ?? isOpen)
  const isEditing = Boolean(task)

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'New Task'}
      description={
        isEditing
          ? 'Update task details and progress'
          : 'Add a new actionable item to your study list'
      }
      maxWidth="max-w-lg"
    >
      <TaskFormContent
        key={task?.id || 'new-task'}
        task={task}
        subjects={subjects}
        plans={plans}
        milestones={milestones}
        onSave={onSave}
        onClose={onClose}
        loading={loading}
      />
    </Modal>
  )
}
