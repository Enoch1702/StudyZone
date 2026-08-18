import { CalendarDays } from 'lucide-react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
import { DeadlineUrgency } from '../ui/DeadlineUrgency'
import { EmptyState } from '../ui/EmptyState'
import { formatDate } from '../../lib/utils'
import { upcomingDeadlines } from '../../data/mockData'

export function UpcomingDeadlinesList() {
  return (
    <Card className="flex h-full flex-col p-0">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <SectionHeader
          title="Upcoming Deadlines"
          description="Sorted by due date"
        />
      </div>

      <div className="flex-1 p-4 sm:p-5">
        {upcomingDeadlines.length === 0 ? (
          <EmptyState
            title="No upcoming deadlines"
            description="Deadlines you add will appear here so you never miss a due date."
          />
        ) : (
          <ul className="space-y-2">
            {upcomingDeadlines.map((deadline) => (
              <li
                key={deadline.id}
                className="rounded-lg border border-border-subtle bg-surface-raised/40 px-3 py-3 transition-colors hover:border-border hover:bg-surface-raised/60 sm:px-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {deadline.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{deadline.subject}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(deadline.date)}
                    </span>
                    <DeadlineUrgency date={deadline.date} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
