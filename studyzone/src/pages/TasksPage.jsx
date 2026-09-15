import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Pencil,
  Plus,
  Search,
  Timer,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { TaskModal } from '../components/tasks/TaskModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { getTasks, createTask, updateTask, toggleTaskComplete, deleteTask } from '../services/tasksService'
import { getSubjects } from '../services/subjectsService'
import { getLearningPlans } from '../services/learningPlansService'
import { supabase } from '../lib/supabase'
import { cn, formatDate } from '../lib/utils'
import { bannerVariant } from '../lib/motion'

function getDueStatus(dueDate) {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { type: 'overdue', label: `Overdue by ${Math.abs(diffDays)}d` }
  if (diffDays === 0) return { type: 'today', label: 'Due Today' }
  if (diffDays === 1) return { type: 'tomorrow', label: 'Due Tomorrow' }
  return { type: 'upcoming', label: `Due in ${diffDays}d` }
}

export default function TasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetTaskId = searchParams.get('id') || null

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
  const [quickFilter, setQuickFilter] = useState('active') // 'active', 'urgent', 'all', 'completed'
  const [priorityFilter, setPriorityFilter] = useState('all')
  const subjectFilter = searchParams.get('subjectId') || 'all'
  const [showCompleted, setShowCompleted] = useState(false)

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

  const milestoneMap = useMemo(() => {
    const map = {}
    for (const m of milestones) {
      map[m.id] = m.title
    }
    return map
  }, [milestones])

  // ─── Filtered + searched task list ────────────────────────────
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (subjectFilter !== 'all' && t.subject_id !== subjectFilter) return false

      if (quickFilter === 'urgent') {
        const s = getDueStatus(t.due_date)
        if (s?.type !== 'overdue' && s?.type !== 'today') return false
        if (t.status === 'completed') return false
      } else if (quickFilter === 'completed') {
        if (t.status !== 'completed') return false
      } else if (quickFilter === 'active') {
        if (t.status === 'completed' || t.status === 'archived') return false
      }

      if (!q) return true

      const titleMatch = t.title?.toLowerCase().includes(q)
      const descMatch = t.description?.toLowerCase().includes(q)
      const sub = (subjectMap[t.subject_id] || '').toLowerCase()
      const subMatch = sub ? sub.includes(q) : false
      return titleMatch || descMatch || subMatch
    })
  }, [tasks, search, priorityFilter, subjectFilter, quickFilter, subjectMap])

  // Task sub-groupings for action-oriented layout
  const overdueAndTodayTasks = useMemo(() => {
    return filteredTasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'archived') return false
      const s = getDueStatus(t.due_date)
      return s?.type === 'overdue' || s?.type === 'today'
    })
  }, [filteredTasks])

  const activeUpcomingTasks = useMemo(() => {
    return filteredTasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'archived') return false
      const s = getDueStatus(t.due_date)
      return !(s?.type === 'overdue' || s?.type === 'today')
    })
  }, [filteredTasks])

  const completedTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === 'completed')
  }, [filteredTasks])

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
    const params = new URLSearchParams()
    if (task.id) params.set('taskId', task.id)
    if (task.subject_id) params.set('subjectId', task.subject_id)
    navigate(`/focus?${params.toString()}`, {
      state: { taskId: task.id, subjectId: task.subject_id },
    })
  }

  // Scroll to target task if opened via deep link / search / calendar
  useEffect(() => {
    if (targetTaskId && !loading) {
      const el = document.getElementById(`task-row-${targetTaskId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [targetTaskId, loading])

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

    const result = await toggleTaskComplete({
      id: task.id,
      userId: user.id,
      isCompleted,
    })

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
      userId: user.id,
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      subjectId: formData.subject_id,
      subject_id: formData.subject_id,
      planId: formData.plan_id,
      plan_id: formData.plan_id,
      milestoneId: formData.milestone_id,
      milestone_id: formData.milestone_id,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.due_date,
      due_date: formData.due_date,
      estimatedMinutes: formData.estimated_minutes,
      estimated_minutes: formData.estimated_minutes,
    }

    let result
    if (modalState.task) {
      result = await updateTask({
        id: modalState.task.id,
        ...payload,
      })
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

    const result = await deleteTask({ id: taskId, userId: user.id })
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

  // ─── Render ───────────────────────────────────────────────────
  return (
    <PageContainer width="wide" className="space-y-5">
      <PageHeader
        title="Tasks & Action Items"
        description="Organize, track, and complete what you're working on."
        icon={ClipboardList}
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

      {/* Action-Oriented Filter Bar */}
      <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 space-y-3 transition-all duration-200">
        {/* Top: Quick Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 pb-3">
          {[
            { id: 'active', label: 'Active Tasks', count: tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived').length },
            { id: 'urgent', label: 'Due Today / Overdue', count: tasks.filter((t) => {
              if (t.status === 'completed' || t.status === 'archived') return false
              const s = getDueStatus(t.due_date)
              return s?.type === 'overdue' || s?.type === 'today'
            }).length },
            { id: 'all', label: 'All Tasks', count: tasks.length },
            { id: 'completed', label: 'Completed', count: tasks.filter((t) => t.status === 'completed').length },
          ].map((tab) => {
            const isSelected = quickFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuickFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                  isSelected
                    ? 'bg-accent text-white shadow-2xs font-bold'
                    : 'text-muted hover:text-foreground hover:bg-surface-raised',
                )}
              >
                <span>{tab.label}</span>
                <span className={cn('text-[10px] font-mono px-1.5 py-0.2 rounded-full', isSelected ? 'bg-white/20 text-white' : 'bg-surface-raised text-muted')}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Bottom: Search & Secondary Filters */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9"
              aria-label="Search tasks"
            />
          </div>

          {/* Subject filter */}
          <Select
            value={subjectFilter}
            onChange={(e) => {
              const val = e.target.value
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                if (val && val !== 'all') {
                  next.set('subjectId', val)
                } else {
                  next.delete('subjectId')
                }
                return next
              })
            }}
            aria-label="Filter by subject"
            className="text-xs h-9"
          >
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          {/* Priority filter */}
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
            className="text-xs h-9"
          >
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingState message="Loading your tasks..." />
      ) : fetchError ? (
        <ErrorState
          title="Failed to load tasks"
          message={fetchError}
          onRetry={handleRetry}
        />
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
          title={
            subjectFilter !== 'all'
              ? `No tasks for ${subjectMap[subjectFilter] || 'this subject'}`
              : 'No tasks match your filters'
          }
          description={
            subjectFilter !== 'all'
              ? `Create an actionable task for ${subjectMap[subjectFilter] || 'this subject'} to start tracking execution.`
              : 'Try adjusting your search or filter criteria.'
          }
          actionLabel={
            subjectFilter !== 'all'
              ? `Add Task for ${subjectMap[subjectFilter] || 'Subject'}`
              : undefined
          }
          onAction={subjectFilter !== 'all' ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="space-y-6">
          {/* 1. Overdue & Due Today Urgent Group (if showing active/all/urgent) */}
          {quickFilter !== 'completed' && overdueAndTodayTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-danger uppercase tracking-wider px-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Immediate Action ({overdueAndTodayTasks.length})</span>
              </div>

              <div className="space-y-2">
                {overdueAndTodayTasks.map((task) => (
                  <TaskRowItem
                    key={task.id}
                    task={task}
                    isCompleted={task.status === 'completed'}
                    isHighlighted={targetTaskId === task.id}
                    focusedMinutes={taskFocusTimeMap.get(task.id) || 0}
                    subjectName={subjectName(task.subject_id)}
                    milestoneTitle={milestoneMap[task.milestone_id]}
                    onToggle={handleToggleComplete}
                    onFocus={handleFocusTask}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. Active / Upcoming Tasks */}
          {quickFilter !== 'completed' && activeUpcomingTasks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-wider px-1">
                <span>Active Agenda ({activeUpcomingTasks.length})</span>
              </div>

              <div className="space-y-2">
                {activeUpcomingTasks.map((task) => (
                  <TaskRowItem
                    key={task.id}
                    task={task}
                    isCompleted={task.status === 'completed'}
                    isHighlighted={targetTaskId === task.id}
                    focusedMinutes={taskFocusTimeMap.get(task.id) || 0}
                    subjectName={subjectName(task.subject_id)}
                    milestoneTitle={milestoneMap[task.milestone_id]}
                    onToggle={handleToggleComplete}
                    onFocus={handleFocusTask}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3. Completed Tasks (Collapsible when in Active view, or open in Completed view) */}
          {completedTasks.length > 0 && (
            <div className="pt-2 border-t border-border/50 space-y-3">
              <button
                type="button"
                onClick={() => setShowCompleted((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {showCompleted || quickFilter === 'completed' ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <span>Completed Tasks ({completedTasks.length})</span>
              </button>

              {(showCompleted || quickFilter === 'completed') && (
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <TaskRowItem
                      key={task.id}
                      task={task}
                      isCompleted={true}
                      isHighlighted={targetTaskId === task.id}
                      focusedMinutes={taskFocusTimeMap.get(task.id) || 0}
                      subjectName={subjectName(task.subject_id)}
                      milestoneTitle={milestoneMap[task.milestone_id]}
                      onToggle={handleToggleComplete}
                      onFocus={handleFocusTask}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
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
        defaultSubjectId={subjectFilter !== 'all' ? subjectFilter : ''}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, task: null })}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
        title="Delete Task"
        confirmText="Delete Task"
        description={
          deleteModalState.task ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {deleteModalState.task.title}
              </span>
              ? This task will be permanently removed from your account.
            </>
          ) : (
            'Are you sure you want to delete this task? This action cannot be undone.'
          )
        }
      />
    </PageContainer>
  )
}

function TaskRowItem({
  task,
  isCompleted,
  isHighlighted = false,
  focusedMinutes,
  subjectName,
  milestoneTitle,
  onToggle,
  onFocus,
  onEdit,
  onDelete,
}) {
  const dueStatus = getDueStatus(task.due_date)

  const priorityStyles = {
    urgent: 'text-danger bg-danger/10 border-danger/20',
    high: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    medium: 'text-accent bg-accent/10 border-accent/20',
    low: 'text-muted bg-surface-raised border-border',
  }

  const priorityDotColors = {
    urgent: 'bg-danger',
    high: 'bg-amber-500',
    medium: 'bg-accent',
    low: 'bg-muted-foreground/40',
  }

  return (
    <div
      id={`task-row-${task.id}`}
      className={cn(
        'group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-150',
        isCompleted
          ? 'bg-surface/50 border-border/50 opacity-75'
          : 'bg-surface border-border hover:border-border-hover hover:shadow-2xs',
        isHighlighted && 'ring-2 ring-accent border-accent/60 bg-accent/5',
      )}
    >
      {/* Left Column: Checkbox & Content */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggle(task)}
          aria-label={`Mark "${task.title}" as ${isCompleted ? 'incomplete' : 'complete'}`}
          className={cn(
            'mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
            isCompleted
              ? 'bg-success border-success text-white'
              : 'border-border-strong hover:border-accent bg-background',
          )}
        >
          {isCompleted && <CheckCircle2 className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium leading-snug break-words',
                isCompleted ? 'line-through text-muted' : 'text-foreground',
              )}
            >
              {task.title}
            </span>

            {/* Priority dot & label */}
            {task.priority && task.priority !== 'medium' && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border',
                  priorityStyles[task.priority] || priorityStyles.low,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', priorityDotColors[task.priority])} />
                {task.priority}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted line-clamp-1 break-words">{task.description}</p>
          )}

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-muted">
            {/* Due date */}
            {dueStatus && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-medium',
                  dueStatus.type === 'overdue' && 'text-danger font-semibold',
                  dueStatus.type === 'today' && 'text-amber-600 dark:text-amber-400 font-semibold',
                )}
              >
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{dueStatus.label} ({formatDate(task.due_date)})</span>
              </span>
            )}

            {/* Subject */}
            {subjectName && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-raised border border-border/70 text-foreground/80">
                <span>{subjectName}</span>
              </span>
            )}

            {/* Milestone */}
            {milestoneTitle && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-raised border border-border/70 text-muted">
                <span>🎯 {milestoneTitle}</span>
              </span>
            )}

            {/* Focus time tracked */}
            {focusedMinutes > 0 && (
              <span className="inline-flex items-center gap-1 text-accent font-medium">
                <Timer className="h-3 w-3 shrink-0" />
                <span>{focusedMinutes}m focused</span>
              </span>
            )}

            {/* Estimated time */}
            {task.estimated_minutes > 0 && (
              <span className="inline-flex items-center gap-1 text-muted">
                <Clock className="h-3 w-3 shrink-0" />
                <span>est. {task.estimated_minutes}m</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Actions */}
      <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
        {!isCompleted && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFocus(task)}
            title="Start a focus session on this task"
            className="h-8 px-2.5 text-xs gap-1.5 text-accent hover:text-accent hover:border-accent"
          >
            <Timer className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Focus</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(task)}
          title="Edit task"
          className="h-8 w-8 p-0 text-muted hover:text-foreground"
          aria-label={`Edit ${task.title}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(task)}
          title="Delete task"
          className="h-8 w-8 p-0 text-muted hover:text-danger"
          aria-label={`Delete ${task.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
