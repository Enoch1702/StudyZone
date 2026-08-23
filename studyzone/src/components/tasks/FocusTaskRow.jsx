import { motion } from 'motion/react'
import { Calendar } from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'
import { Checkbox } from '../ui/Checkbox'
import { PriorityBadge } from '../ui/Badge'
import { staggerItem } from '../../lib/motion'

/**
 * @param {{ task: object, subjectName: string, onToggle: Function }} props
 * task uses real schema fields: id, title, priority, status, due_date
 */
export function FocusTaskRow({ task, subjectName = '', onToggle }) {
  const isCompleted = task.status === 'completed'

  return (
    <motion.li variants={staggerItem} layout>
      <div
        className={cn(
          'group flex items-start gap-3 rounded-lg border px-3 py-3 transition-all duration-200 sm:items-center sm:px-4',
          isCompleted
            ? 'border-border-subtle bg-surface-raised/20 opacity-70 hover:opacity-90'
            : 'border-border-subtle bg-surface-raised/40 hover:border-border hover:bg-surface-raised/70 hover:shadow-xs',
        )}
      >
        <Checkbox
          id={`focus-${task.id}`}
          bare
          checked={isCompleted}
          onChange={() => onToggle(task.id)}
          className="mt-0.5 sm:mt-0"
        />

        <label
          htmlFor={`focus-${task.id}`}
          className="min-w-0 flex-1 cursor-pointer select-none"
        >
          <p
            className={cn(
              'text-sm font-medium leading-snug transition-all duration-200',
              isCompleted
                ? 'text-muted line-through decoration-muted-foreground/50'
                : 'text-foreground',
            )}
          >
            {task.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:mt-1.5">
            {subjectName && (
              <span className="text-xs text-muted">{subjectName}</span>
            )}
            <PriorityBadge priority={task.priority} />
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Due {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </label>
      </div>
    </motion.li>
  )
}
