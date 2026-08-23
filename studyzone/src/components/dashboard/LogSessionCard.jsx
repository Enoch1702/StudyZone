import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, BookOpen, Check } from 'lucide-react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { useAuth } from '../../context/useAuth'
import { createStudySession } from '../../services/studySessionsService'
import { bannerVariant } from '../../lib/motion'

/**
 * Minimal study session logging card.
 * Replaces the AI stub in the dashboard layout slot.
 *
 * @param {{ subjects: Array, tasks: Array, onSessionLogged: Function }} props
 */
export function LogSessionCard({ subjects, tasks, onSessionLogged }) {
  const { user } = useAuth()

  const [subjectId, setSubjectId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // When subject changes, clear the task selection (avoid cross-subject task mismatch)
  function handleSubjectChange(val) {
    setSubjectId(val)
    setTaskId('')
    setError('')
    setSuccess(false)
  }

  // Filter tasks to match selected subject (or all incomplete tasks if no subject selected)
  const availableTasks = subjectId
    ? tasks.filter((t) => t.subject_id === subjectId)
    : tasks

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!durationMinutes || durationMinutes === '') {
      setError('Please enter how many minutes you studied.')
      return
    }

    const mins = Number(durationMinutes)
    if (!Number.isInteger(mins) || mins <= 0) {
      setError('Duration must be a positive whole number (e.g. 30, 90).')
      return
    }

    setLoading(true)

    const { error: saveError } = await createStudySession({
      userId: user.id,
      subjectId: subjectId || null,
      taskId: taskId || null,
      durationMinutes: mins,
      notes,
    })

    setLoading(false)

    if (saveError) {
      setError(saveError.message || 'Failed to log study session.')
      return
    }

    // Reset form
    setSubjectId('')
    setTaskId('')
    setDurationMinutes('')
    setNotes('')
    setSuccess(true)

    // Notify dashboard to refresh the chart
    onSessionLogged?.()

    // Clear success state after 3s
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <Card className="flex h-full flex-col p-0 border-border hover:border-border/80 transition-all duration-200">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <SectionHeader
          title="Log Study Session"
          description="Record your study time to track weekly progress."
        />
      </div>

      <div className="flex-1 p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="flex h-full flex-col gap-3">
          {/* Error & Success animated banners */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error-banner"
                variants={bannerVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <div
                  className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                key="success-banner"
                variants={bannerVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Session logged! Chart will update shortly.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Duration (required) */}
          <div className="space-y-1.5">
            <label htmlFor="session-duration" className="block text-xs font-medium text-foreground">
              Duration (minutes) <span className="text-danger">*</span>
            </label>
            <Input
              id="session-duration"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 60"
              value={durationMinutes}
              onChange={(e) => { setDurationMinutes(e.target.value); setError(''); setSuccess(false) }}
              disabled={loading}
              required
            />
          </div>

          {/* Subject (optional) */}
          <div className="space-y-1.5">
            <label htmlFor="session-subject" className="block text-xs font-medium text-muted">
              Subject <span className="text-[11px] text-muted-foreground">(optional)</span>
            </label>
            <Select
              id="session-subject"
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
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

          {/* Task (optional, filtered by subject) */}
          <div className="space-y-1.5">
            <label htmlFor="session-task" className="block text-xs font-medium text-muted">
              Task <span className="text-[11px] text-muted-foreground">(optional)</span>
            </label>
            <Select
              id="session-task"
              value={taskId}
              onChange={(e) => { setTaskId(e.target.value); setError(''); setSuccess(false) }}
              disabled={loading || availableTasks.length === 0}
              className="w-full"
            >
              <option value="">No task</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Notes (optional) */}
          <div className="space-y-1.5">
            <label htmlFor="session-notes" className="block text-xs font-medium text-muted">
              Notes <span className="text-[11px] text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="session-notes"
              placeholder="What did you work on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="mt-auto pt-2">
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4" />
                  <span>Log Session</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
