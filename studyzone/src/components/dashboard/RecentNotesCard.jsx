import { Link } from 'react-router-dom'
import { FileText, Pin } from 'lucide-react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
import { EmptyState } from '../ui/EmptyState'
import { formatDate } from '../../lib/utils'

export function RecentNotesCard({ loading, notes = [], subjects = [] }) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]))

  return (
    <Card className="flex h-full flex-col p-0">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4 sm:px-5">
        <SectionHeader
          title="Recent Study Notes"
          description={
            loading
              ? 'Loading…'
              : `${notes.length} note${notes.length === 1 ? '' : 's'} available`
          }
        />
        <Link
          to="/notes"
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
        >
          <span>View all</span>
          <span>&rarr;</span>
        </Link>
      </div>

      <div className="flex-1 p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-raised/40" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No study notes yet"
            description="Capture lecture summaries, key ideas, and prepare for revision."
            actionLabel="Create Note"
            actionLink="/notes"
          />
        ) : (
          <div className="space-y-2.5">
            {notes.slice(0, 3).map((note) => {
              const sub = subjectMap.get(note.subjectId)
              const excerpt = (note.summary || note.content || '')
                .replace(/[#*`_>]/g, '')
                .slice(0, 70)
                .trim()

              return (
                <Link
                  key={note.id}
                  to={`/notes?id=${note.id}`}
                  className="block p-2.5 rounded-xl border border-border/70 bg-surface hover:border-accent/40 hover:bg-surface-raised/40 transition-all text-left group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                      {note.title}
                    </span>
                    {note.isPinned && (
                      <Pin className="h-3 w-3 text-amber-500 fill-current shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                    {excerpt || 'Empty note'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5 pt-1 border-t border-border/40">
                    <span className="truncate">
                      {sub ? `📚 ${sub.name}` : 'General Note'}
                    </span>
                    <span className="font-mono">{formatDate(note.updatedAt)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
