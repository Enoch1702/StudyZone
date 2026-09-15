import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Brain,
  CheckSquare,
  Clock,
  FileText,
  Flame,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { cardEntrance } from '../../lib/motion'

export function SubjectCard({
  subject,
  noteCount = 0,
  taskCount = 0,
  flashcardCount = 0,
  studyMinutes = 0,
  onEdit,
  onDelete,
}) {
  const formattedStudyTime =
    studyMinutes >= 60
      ? `${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`
      : `${studyMinutes}m`

  return (
    <motion.article
      variants={cardEntrance}
      layout
      className={cn(
        'group relative flex flex-col justify-between w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-all duration-200',
        'hover:border-border/80 hover:bg-surface-raised/30 hover:shadow-xs',
      )}
    >
      {/* Subject Color Accent Strip */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: subject.color || '#4f7cff' }}
        aria-hidden="true"
      />

      <div className="p-4 pl-5 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Header row: Title & Actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: subject.color || '#4f7cff' }}
                  aria-hidden="true"
                />
                <h3 className="text-base font-semibold text-foreground truncate">
                  {subject.name}
                </h3>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(subject)}
                  aria-label={`Edit ${subject.name}`}
                  title="Edit subject"
                  className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors active:scale-95 cursor-pointer"
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
                  className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors active:scale-95 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
            {subject.description || (
              <span className="italic text-muted-foreground/70">No description provided</span>
            )}
          </p>
        </div>

        {/* Connected Materials Summary */}
        <div className="pt-1">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
            Workspace Contents
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              to={`/notes?subjectId=${subject.id}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-surface-raised/40 hover:bg-surface-raised border border-border/50 hover:border-accent/30 text-muted hover:text-foreground transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="truncate">
                <strong className="text-foreground">{noteCount}</strong> {noteCount === 1 ? 'Note' : 'Notes'}
              </span>
            </Link>

            <Link
              to={`/tasks?subjectId=${subject.id}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-surface-raised/40 hover:bg-surface-raised border border-border/50 hover:border-accent/30 text-muted hover:text-foreground transition-all"
            >
              <CheckSquare className="h-3.5 w-3.5 text-success shrink-0" />
              <span className="truncate">
                <strong className="text-foreground">{taskCount}</strong> {taskCount === 1 ? 'Task' : 'Tasks'}
              </span>
            </Link>

            <Link
              to={`/flashcards?subjectId=${subject.id}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-surface-raised/40 hover:bg-surface-raised border border-border/50 hover:border-accent/30 text-muted hover:text-foreground transition-all"
            >
              <Brain className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="truncate">
                <strong className="text-foreground">{flashcardCount}</strong> {flashcardCount === 1 ? 'Deck' : 'Decks'}
              </span>
            </Link>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-raised/40 border border-border/50 text-muted">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="truncate">
                <strong className="text-foreground">{formattedStudyTime}</strong> focused
              </span>
            </div>
          </div>
        </div>

        {/* Primary Learning Action */}
        <div className="border-t border-border/50 pt-3 flex items-center justify-between gap-2">
          <Link
            to={`/notes?subjectId=${subject.id}`}
            className="text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            Browse notes &rarr;
          </Link>

          <Link
            to={`/focus?subjectId=${subject.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent text-accent hover:text-white text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Start Focus</span>
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
