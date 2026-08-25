import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ClipboardList, Pencil, Plus, RefreshCw, Search, Timer, Trash2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Checkbox } from '../components/ui/Checkbox'
import { PriorityBadge, Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { TaskModal } from '../components/tasks/TaskModal'
import { DeleteTaskModal } from '../components/tasks/DeleteTaskModal'
import { getTasks, createTask, updateTask, toggleTaskComplete, deleteTask } from '../services/tasksService'
import { getSubjects } from '../services/subjectsService'
import { getLearningPlans } from '../services/learningPlansService'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { bannerVariant } from '../lib/motion'

export default function TasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // ─── Data state ───────────────────────────────────────────────
  const [tasks, setTasks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [plans, setPlans] = useState([])
  const [milestones, setMilestones] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // ─── Filter state ─────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // ─── Modal state ──────────────────────────────────────────────
  const [modalState, setModalState] = useState({ isOpen: false, task: null })
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, task: null })

  // ─── Action state ─────────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(false)
  const [bannerError, setBannerError] = useState('')

  // ─── Fetch tasks + subjects + plans + milestones + sessions ──
  useEffect(() => {
    let ignore = false

    async function loadData() {
      if (!user?.id) return

      setLoading(true)
      setFetchError('')

      const [tasksResult, subjectsResult, plansResult, sessionRes, milestoneRes] = await Promise.all([
        getTasks(user.id),
        getSubjects(user.id),
        getLearningPlans(user.id),
        supabase.from('study_sessions').select('task_id, duration_minutes').eq('user_id', user.id),
        supabase.from('learning_milestones').select('*').eq('user_id', user.id),
      ])

      if (ignore) return

      if (tasksResult.error) {
        setFetchError(tasksResult.error.message || 'Unable to load tasks.')
      } else {
        setTasks(tasksResult.data || [])
      }

      if (!subjectsResult.error) {
        setSubjects(subjectsResult.data || [])
      }

      if (plansResult.data) {
        setPlans(plansResult.data)
      }

      if (sessionRes.data) {
        setSessions(sessionRes.data)
      }

      if (milestoneRes.data) {
        setMilestones(milestoneRes.data)
      }

      setLoading(false)
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [user, reloadKey])

  // Map of total focus minutes per task
  const taskFocusTimeMap = useMemo(() => {
    const map = new Map()
    for (const s of sessions) {
      if (s.task_id) {
        const current = map.get(s.task_id) || 0
        map.set(s.task_id, current + (s.duration_minutes || 0))
      }
    }
    return map
  }, [sessions])

  // ─── Subject lookup helper ────────────────────────────────────
  const subjectMap = useMemo(() => {
    const map = {}
    for (const s of subjects) {
      map[s.id] = s.name
    }
    return map
  }, [subjects])

  function subjectName(subjectId) {
    if (!subjectId) return null
    return subjectMap[subjectId] || null
  }

  // ─── Filtered + searched task list ────────────────────────────
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (subjectFilter !== 'all' && t.subject_id !== subjectFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (!q) return true

      const titleMatch = t.title?.toLowerCase().includes(q)
      const descMatch = t.description?.toLowerCase().includes(q)
      const sub = (subjectMap[t.subject_id] || '').toLowerCase()
      const subMatch = sub ? sub.includes(q) : false
      return titleMatch || descMatch || subMatch
    })
  }, [tasks, search, priorityFilter, subjectFilter, statusFilter, subjectMap])

  // ─── Handlers ──────────────────────────────────────────────────
  function handleOpenCreate() {
    setBannerError('')
    setModalState({ isOpen: true, task: null })
  }

  function handleOpenEdit(task) {
    setBannerError('')
    setModalState({ isOpen: true, task })
  }

  function handleOpenDelete(task) {
    setBannerError('')
    setDeleteModalState({ isOpen: true, task })
  }

  function handleFocusTask(task) {
    navigate('/focus', {
      state: { taskId: task.id, subjectId: task.subject_id },
    })
  }

  async function handleToggleComplete(task) {
    setBannerError('')
    const isCompleted = task.status === 'completed'
    const newStatus = isCompleted ? 'pending' : 'completed'
    const now = new Date().toISOString()

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus, completed_at: isCompleted ? null : now }
          : t,
      ),
    )

    const result = await toggleTaskComplete(task.id, isCompleted, user.id)

    if (result.error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t)),
      )
      setBannerError(result.error.message || 'Failed to update task status.')
    }
  }

  async function handleSaveTask(formData) {
    if (!user?.id) return
    setActionLoading(true)
    setBannerError('')

    const payload = {
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      subject_id: formData.subject_id,
      plan_id: formData.plan_id,
      milestone_id: formData.milestone_id,
      priority: formData.priority,
      status: formData.status,
      due_date: formData.due_date,
      estimated_minutes: formData.estimated_minutes,
    }

    let result
    if (modalState.task) {
      result = await updateTask(modalState.task.id, payload, user.id)
    } else {
      result = await createTask(payload)
    }

    setActionLoading(false)

    if (result.error) {
      setBannerError(result.error.message || 'Failed to save task.')
      return
    }

    setModalState({ isOpen: false, task: null })
    setReloadKey((k) => k + 1)
  }

  async function handleConfirmDelete() {
    if (!deleteModalState.task || !user?.id) return
    const taskId = deleteModalState.task.id
    setActionLoading(true)
    setBannerError('')

    const result = await deleteTask(taskId, user.id)
    setActionLoading(false)

    if (result.error) {
      setBannerError(result.error.message || 'Failed to delete task.')
      return
    }

    setDeleteModalState({ isOpen: false, task: null })
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  function handleRetry() {
    setReloadKey((k) => k + 1)
  }

  function statusBadgeVariant(status) {
    if (status === 'completed') return 'success'
    if (status === 'in-progress') return 'accent'
    if (status === 'archived') return 'default'
    return 'default'
  }

  function statusLabel(status) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <PageContainer width="wide" className="space-y-5">
      <PageHeader
        description="Organize, track, and complete what you're working on."
        actions={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        }
      />

      {/* Global Error Banner */}
      <AnimatePresence>
        {bannerError && (
          <motion.div
            variants={bannerVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div
              className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/10 p-4 text-xs text-danger"
              role="alert"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{bannerError}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerError('')}
                className="text-danger hover:underline ml-3 font-medium"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border/80">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
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

          {/* Priority filter */}
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>

          {/* Subject filter */}
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filter by subject"
          >
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingState message="Loading your tasks..." />
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger border border-danger/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Failed to load tasks</h3>
          <p className="max-w-md text-sm text-muted">{fetchError}</p>
          <Button variant="secondary" size="sm" onClick={handleRetry} className="gap-2 mt-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks yet"
          description="Add your first task to start planning your learning and tracking your daily progress."
          actionLabel="Add Task"
          onAction={handleOpenCreate}
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks match your filters"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs transition-all duration-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised/60">
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider" scope="col">
                    Task
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider" scope="col">
                    Subject
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider" scope="col">
                    Priority
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider" scope="col">
                    Due & Focus
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider" scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === 'completed'
                  const focusedMinutes = taskFocusTimeMap.get(task.id) || 0

                  return (
                    <tr
                      key={task.id}
                      className="border-b border-border-subtle bg-surface transition-colors duration-150 hover:bg-surface-raised/40 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={isCompleted}
                          onChange={() => handleToggleComplete(task)}
                          label={task.title}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {subjectName(task.subject_id) || (
                          <span className="italic text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(task.status)}>
                          {statusLabel(task.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {task.due_date ? formatDate(task.due_date) : (
                          <span className="italic text-muted-foreground/60">—</span>
                        )}
                        {(focusedMinutes > 0 || task.estimated_minutes) && (
                          <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">
                            {focusedMinutes > 0 ? `${focusedMinutes}m focused` : ''}
                            {focusedMinutes > 0 && task.estimated_minutes ? ' / ' : ''}
                            {task.estimated_minutes ? `${task.estimated_minutes}m est` : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Quick Focus Button */}
                          {!isCompleted && (
                            <button
                              type="button"
                              aria-label={`Focus on ${task.title}`}
                              title="Start Focus Session"
                              onClick={() => handleFocusTask(task)}
                              className="rounded-lg p-1.5 text-accent hover:bg-accent/15 transition-colors active:scale-95 cursor-pointer"
                            >
                              <Timer className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={`Edit ${task.title}`}
                            onClick={() => handleOpenEdit(task)}
                            className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors active:scale-95 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${task.title}`}
                            onClick={() => handleOpenDelete(task)}
                            className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, task: null })}
        onSave={handleSaveTask}
        task={modalState.task}
        subjects={subjects}
        plans={plans}
        milestones={milestones}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTaskModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, task: null })}
        onConfirm={handleConfirmDelete}
        task={deleteModalState.task}
        loading={actionLoading}
      />
    </PageContainer>
  )
}
