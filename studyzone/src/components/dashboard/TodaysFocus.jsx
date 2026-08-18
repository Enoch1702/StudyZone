import { useState } from 'react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../layout/PageContainer'
import { EmptyState } from '../ui/EmptyState'
import { FocusTaskRow } from '../tasks/FocusTaskRow'
import { todaysFocusTasks as initialTasks } from '../../data/mockData'

export function TodaysFocus() {
  const [tasks, setTasks] = useState(initialTasks)

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  const pendingCount = tasks.filter((t) => !t.completed).length

  return (
    <Card className="flex h-full flex-col p-0">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <SectionHeader
          title="Today's Focus"
          description={`${pendingCount} remaining · ${tasks.length} total`}
        />
      </div>

      <div className="flex-1 p-4 sm:p-5">
        {tasks.length === 0 ? (
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
                onToggle={toggleTask}
              />
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
