import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const DEADLINE_TYPE_OPTIONS = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam', label: 'Exam' },
  { value: 'project', label: 'Project' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'other', label: 'Other' },
]

/**
 * Keyed to deadline?.id so React unmounts/remounts between create and edit,
 * giving each form clean initial state.
 */
function DeadlineFormContent({ deadline, subjects, onSave, onClose, loading }) {
  const isEditing = Boolean(deadline)

  const [title, setTitle] = useState(deadline?.title || '')
  const [description, setDescription] = useState(deadline?.description || '')
  const [deadlineType, setDeadlineType] = useState(deadline?.deadline_type || 'assignment')
  const [subjectId, setSubjectId] = useState(deadline?.subject_id || '')
  // due_date is TIMESTAMPTZ — extract YYYY-MM-DD for the date input
  const [dueDate, setDueDate] = useState(
    deadline?.due_date ? deadline.due_date.split('T')[0] : '',
  )
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError('Please enter a deadline title.')
      return
    }

    if (!dueDate) {
      setError('A due date is required.')
      return
    }

    await onSave({
      title: cleanTitle,
      description: description.trim(),
      deadlineType,
      subjectId: subjectId || null,
      // Convert local date string to ISO for Supabase TIMESTAMPTZ
      dueDate: new Date(dueDate).toISOString(),
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
        <label htmlFor="deadline-title" className="block text-xs font-medium text-foreground">
          Deadline Title <span className="text-danger">*</span>
        </label>
        <Input
          id="deadline-title"
          type="text"
          placeholder="e.g. Midterm Exam, Research Paper"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          autoFocus
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="deadline-description" className="block text-xs font-medium text-muted">
          Description <span className="text-[11px] text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="deadline-description"
          placeholder="Additional notes or instructions..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={2}
        />
      </div>

      {/* Type & Subject row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="deadline-type" className="block text-xs font-medium text-muted">
            Type
          </label>
          <Select
            id="deadline-type"
            value={deadlineType}
            onChange={(e) => setDeadlineType(e.target.value)}
            disabled={loading}
            className="w-full"
          >
            {DEADLINE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="deadline-subject" className="block text-xs font-medium text-muted">
            Subject <span className="text-[11px] text-muted-foreground">(optional)</span>
          </label>
          <Select
            id="deadline-subject"
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
      </div>

      {/* Due Date */}
      <div className="space-y-1.5">
        <label htmlFor="deadline-due-date" className="block text-xs font-medium text-foreground">
          Due Date <span className="text-danger">*</span>
        </label>
        <Input
          id="deadline-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={loading}
          required
        />
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
            <span>{isEditing ? 'Save Changes' : 'Add Deadline'}</span>
          )}
        </Button>
      </div>
    </form>
  )
}

export function DeadlineModal({
  open,
  isOpen,
  onClose,
  onSave,
  deadline = null,
  subjects = [],
  loading = false,
}) {
  const isModalOpen = Boolean(open ?? isOpen)
  const isEditing = Boolean(deadline)

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Deadline' : 'Add New Deadline'}
      description={
        isEditing
          ? 'Update target date, urgency, and subject'
          : 'Schedule an exam, project submission, or milestone'
      }
      maxWidth="max-w-lg"
    >
      <DeadlineFormContent
        key={deadline?.id || 'new-deadline'}
        deadline={deadline}
        subjects={subjects}
        onSave={onSave}
        onClose={onClose}
        loading={loading}
      />
    </Modal>
  )
}
