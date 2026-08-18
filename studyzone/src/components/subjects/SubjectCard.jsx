import { ListTodo } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ProgressBar } from '../ui/ProgressBar'

export function SubjectCard({ subject, onClick }) {
  const Wrapper = onClick ? 'button' : 'article'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors',
        'hover:border-border/90 hover:bg-surface-raised/20',
        onClick && 'cursor-pointer',
      )}
    >
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: subject.color }}
        aria-hidden="true"
      />

      <div className="p-4 pl-5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground group-hover:text-foreground">
              {subject.name}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
              {subject.description}
            </p>
          </div>
          <span
            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-muted"
          >
            <ListTodo className="h-3 w-3" />
            {subject.taskCount}
          </span>
        </div>

        <div className="mt-4 border-t border-border-subtle pt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted">Course progress</span>
            <span className="font-medium tabular-nums text-foreground">
              {subject.progress}%
            </span>
          </div>
          <ProgressBar value={subject.progress} color={subject.color} />
        </div>
      </div>
    </Wrapper>
  )
}
