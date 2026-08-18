import { Calendar } from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'
import { Checkbox } from '../ui/Checkbox'
import { PriorityBadge } from '../ui/Badge'

export function FocusTaskRow({ task, onToggle }) {
  return (
    <li>
      <div
        className={cn(
          'group flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors sm:items-center sm:px-4',
          task.completed
            ? 'border-border-subtle bg-surface-raised/30 opacity-80 hover:opacity-100'
            : 'border-border-subtle bg-surface-raised/40 hover:border-border hover:bg-surface-raised/70',
        )}
      >
        <Checkbox
          id={`focus-${task.id}`}
          bare
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="mt-0.5 sm:mt-0"
        />

        <label
          htmlFor={`focus-${task.id}`}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <p
            className={cn(
              'text-sm font-medium leading-snug',
              task.completed
                ? 'text-muted line-through decoration-muted-foreground/50'
                : 'text-foreground',
            )}
          >
            {task.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:mt-1.5">
            <span className="text-xs text-muted">{task.subject}</span>
            <PriorityBadge priority={task.priority} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Due {formatDate(task.dueDate)}
            </span>
          </div>
        </label>
      </div>
    </li>
  )
}
