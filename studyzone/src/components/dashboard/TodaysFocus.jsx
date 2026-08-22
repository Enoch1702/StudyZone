import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
import { EmptyState } from '../ui/EmptyState'
import { FocusTaskRow } from '../tasks/FocusTaskRow'
import { toggleTaskComplete } from '../../services/tasksService'
import { useAuth } from '../../context/useAuth'

/**
 * @param {{ loading: boolean, tasks: Array, subjects: Array, onTaskToggled: Function }} props
 * tasks use real schema fields (id, title, priority, status, due_date, subject_id)
 */
export function TodaysFocus({ loading, tasks, subjects, onTaskToggled }) {
  const { user } = useAuth()

  function subjectName(subjectId) {
    if (!subjectId) return ''
    const match = subjects.find((s) => s.id === subjectId)
    return match ? match.name : ''
  }

  async function handleToggle(taskId) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || !user?.id) return

    const isCompleted = task.status === 'completed'
    await toggleTaskComplete({ id: taskId, userId: user.id, isCompleted })
    // Refresh dashboard data
    onTaskToggled?.()
  }

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length

  return (
    <Card className="flex h-full flex-col p-0">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <SectionHeader
          title="Today's Focus"
          description={
            loading
              ? 'Loading…'
              : `${pendingCount} remaining · ${tasks.length} total`
          }
        />
      </div>

      <div className="flex-1 p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-raised/40" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks for today"
            description="You're all caught up. Add a task or enjoy the break."
          />
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <FocusTaskRow
                key={task.id}
                task={task}
                subjectName={subjectName(task.subject_id)}
                onToggle={handleToggle}
              />
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
