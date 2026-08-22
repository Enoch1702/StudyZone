import { useState, useEffect } from 'react'
import { AlertCircle, BookOpen, Check, X } from 'lucide-react'
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

export function SubjectModal({ isOpen, onClose, onSave, subject = null, loading = false }) {
  const isEditing = Boolean(subject)
  const headerColor = subject?.color || '#4f7cff'

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!loading) onClose()
        }}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border"
              style={{ backgroundColor: `${headerColor}20` }}
            >
              <BookOpen className="h-4 w-4" style={{ color: headerColor }} />
            </div>
            <h2 id="subject-modal-title" className="text-base font-semibold text-foreground">
              {isEditing ? 'Edit Subject' : 'Add New Subject'}
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

        {/* Form Body keyed to subject id or new */}
        <SubjectFormContent
          key={subject?.id || 'new-subject'}
          subject={subject}
          onSave={onSave}
          onClose={onClose}
          loading={loading}
        />
      </div>
    </div>
  )
}
