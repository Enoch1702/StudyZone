import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Checkbox } from '../components/ui/Checkbox'
import { PriorityBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDate } from '../lib/utils'
import { initialTasks, subjectNames } from '../data/mockData'

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        search === '' ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.subject.toLowerCase().includes(search.toLowerCase())

      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter

      const matchesSubject =
        subjectFilter === 'all' || task.subject === subjectFilter

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && task.completed) ||
        (statusFilter === 'pending' && !task.completed) ||
        task.status === statusFilter

      return matchesSearch && matchesPriority && matchesSubject && matchesStatus
    })
  }, [tasks, search, priorityFilter, subjectFilter, statusFilter])

  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              status: !task.completed ? 'completed' : 'pending',
            }
          : task,
      ),
    )
  }

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Manage and filter all your academic tasks in one place.
        </p>
        <Button>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search tasks"
            />
          </div>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filter by subject"
          >
            <option value="all">All subjects</option>
            {subjectNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          description={
            tasks.length === 0
              ? 'Create your first task to start tracking your work.'
              : 'Try adjusting your search or filter criteria.'
          }
          actionLabel={tasks.length === 0 ? 'Add Task' : undefined}
          onAction={tasks.length === 0 ? () => {} : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised/50">
                  <th className="px-4 py-3 font-medium text-muted" scope="col">
                    Task
                  </th>
                  <th className="px-4 py-3 font-medium text-muted" scope="col">
                    Subject
                  </th>
                  <th className="px-4 py-3 font-medium text-muted" scope="col">
                    Priority
                  </th>
                  <th className="px-4 py-3 font-medium text-muted" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-muted" scope="col">
                    Due
                  </th>
                  <th className="px-4 py-3 font-medium text-muted" scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-border-subtle bg-surface transition-colors hover:bg-surface-raised/30 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onChange={() => toggleComplete(task.id)}
                        label={task.title}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted">{task.subject}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          task.completed
                            ? 'success'
                            : task.status === 'in-progress'
                              ? 'accent'
                              : 'default'
                        }
                      >
                        {task.completed ? 'Completed' : task.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${task.title}`}
                          className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${task.title}`}
                          className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
