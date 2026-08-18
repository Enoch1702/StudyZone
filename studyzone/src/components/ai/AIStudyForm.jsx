import { Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'

export function AIStudyForm({
  compact = false,
  className,
  onSubmit,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.()
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <label htmlFor="study-goal" className="text-xs font-medium text-muted">
          What do you need to study?
        </label>
        <Textarea
          id="study-goal"
          rows={compact ? 3 : 5}
          placeholder="Describe your goal, topics, and timeline — e.g. Linear Algebra midterm in 4 days covering eigenvalues and diagonalization."
          aria-label="Study goal"
          className={compact ? 'min-h-[88px]' : 'min-h-[120px]'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <label htmlFor="study-hours" className="text-xs font-medium text-muted">
            Available study time (optional)
          </label>
          <Input
            id="study-hours"
            type="text"
            placeholder="e.g. 2 hours/day"
            aria-label="Available study time"
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto sm:min-w-[180px]">
          <Sparkles className="h-4 w-4" />
          Generate Study Plan
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Plans are generated from your goals and schedule. AI backend integration coming soon.
      </p>
    </form>
  )
}

export function AIStudyFormHeader({ compact = false }) {
  return (
    <div className={cn('flex items-start gap-3', compact ? 'mb-4' : 'mb-5')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-muted">
        <Sparkles className="h-4 w-4 text-accent" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          AI Study Assistant
        </p>
        <h2
          className={cn(
            'font-semibold tracking-tight text-foreground',
            compact ? 'mt-0.5 text-sm' : 'mt-1 text-lg',
          )}
        >
          Build a focused study plan
        </h2>
        <p className="mt-1 text-sm text-muted">
          Describe what you&apos;re preparing for and get a structured plan tailored to your time.
        </p>
      </div>
    </div>
  )
}
