import { motion } from 'motion/react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { cardEntrance } from '../../lib/motion'

export function SubjectCard({ subject, onEdit, onDelete }) {
  return (
    <motion.article
      variants={cardEntrance}
      layout
      className={cn(
        'group relative flex flex-col justify-between w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-all duration-200',
        'hover:border-border/80 hover:bg-surface-raised/30 hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      {/* Subject Color Accent Strip */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: subject.color || '#4f7cff' }}
        aria-hidden="true"
      />

      <div className="p-4 pl-5 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header row: Title & Actions */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground truncate pr-2">
              {subject.name}
            </h3>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(subject)}
                  aria-label={`Edit ${subject.name}`}
                  title="Edit subject"
                  className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors active:scale-95"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(subject)}
                  aria-label={`Delete ${subject.name}`}
                  title="Delete subject"
                  className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {subject.description || (
              <span className="italic text-muted-foreground/70">No description provided</span>
            )}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-5 border-t border-border-subtle pt-3 flex items-center justify-between text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: subject.color || '#4f7cff' }}
              aria-hidden="true"
            />
            <span className="text-[11px] text-muted-foreground">Subject</span>
          </span>
          <span className="text-[11px] text-muted-foreground">No task data yet</span>
        </div>
      </div>
    </motion.article>
  )
}
