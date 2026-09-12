import { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const PRESET_COLORS = [
  { label: 'Blue', value: '#4f7cff' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Red', value: '#ef4444' },
]

function SubjectFormContent({ subject, onSave, onClose, loading }) {
  const isEditing = Boolean(subject)
  const [name, setName] = useState(subject?.name || '')
  const [description, setDescription] = useState(subject?.description || '')
  const [color, setColor] = useState(subject?.color || '#4f7cff')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanName = name.trim()
    if (!cleanName) {
      setError('Please enter a subject name.')
      return
    }

    await onSave({
      name: cleanName,
      description: description.trim(),
      color,
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

      {/* Name Field */}
      <div className="space-y-1.5">
        <label htmlFor="subject-name" className="block text-xs font-medium text-foreground">
          Subject Name <span className="text-danger">*</span>
        </label>
        <Input
          id="subject-name"
          type="text"
          placeholder="e.g. Linear Algebra, Organic Chemistry"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          autoFocus
          required
        />
      </div>

      {/* Description Field */}
      <div className="space-y-1.5">
        <label htmlFor="subject-description" className="block text-xs font-medium text-muted">
          Description <span className="text-[11px] text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="subject-description"
          placeholder="Brief course overview, textbook references, or classroom goals..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>

      {/* Color Palette Picker */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted">
          Course Color Tag
        </label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {PRESET_COLORS.map((preset) => {
            const isSelected = color.toLowerCase() === preset.value.toLowerCase()
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setColor(preset.value)}
                disabled={loading}
                title={preset.label}
                className="group relative flex h-9 w-full items-center justify-center rounded-lg border transition-all"
                style={{
                  backgroundColor: preset.value,
                  borderColor: isSelected ? '#ffffff' : 'transparent',
                }}
              >
                {isSelected && (
                  <Check className="h-4 w-4 text-white drop-shadow-sm" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer Actions */}
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
              <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
            </>
          ) : (
            <span>{isEditing ? 'Save Changes' : 'Create Subject'}</span>
          )}
        </Button>
      </div>
    </form>
  )
}

export function SubjectModal({
  open,
  isOpen,
  onClose,
  onSave,
  subject = null,
  loading = false,
}) {
  const isModalOpen = Boolean(open ?? isOpen)
  const isEditing = Boolean(subject)

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subject' : 'Add New Subject'}
      description={
        isEditing
          ? 'Update course information and tags'
          : 'Create a course to organize tasks and notes'
      }
      maxWidth="max-w-lg"
    >
      <SubjectFormContent
        key={subject?.id || 'new-subject'}
        subject={subject}
        onSave={onSave}
        onClose={onClose}
        loading={loading}
      />
    </Modal>
  )
}
