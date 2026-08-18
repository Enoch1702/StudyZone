import { CalendarDays, FileText, GraduationCap } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { DeadlineUrgency } from '../components/ui/DeadlineUrgency'
import { EmptyState } from '../components/ui/EmptyState'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { formatDate } from '../lib/utils'
import { allDeadlines } from '../data/mockData'

export default function DeadlinesPage() {
  const sorted = [...allDeadlines].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  )

  return (
    <PageContainer width="wide" className="space-y-5">
      <PageHeader description="Track exams and assignment due dates across all your subjects." />

      {sorted.length === 0 ? (
        <EmptyState
          title="No deadlines scheduled"
          description="Add deadlines to keep track of exams and assignment due dates."
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((deadline) => {
            const Icon = deadline.type === 'exam' ? GraduationCap : FileText

            return (
              <article
                key={deadline.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-4 transition-colors hover:border-border/90 hover:bg-surface-raised/20 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-raised">
                    <Icon className="h-4 w-4 text-muted" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {deadline.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">{deadline.subject}</p>
                    <Badge variant="default" className="mt-2 capitalize">
                      {deadline.type}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:items-end">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(deadline.date)}
                  </span>
                  <DeadlineUrgency date={deadline.date} />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
