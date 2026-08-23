import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Compass,
  Edit2,
  Milestone,
  PlayCircle,
  Plus,
  Square,
  CheckSquare,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Badge } from '../components/ui/Badge'
import { TaskModal } from '../components/tasks/TaskModal'
import {
  getLearningPlanById,
  updateLearningPlan,
  deleteLearningPlan,
  getMilestonesForPlan,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  calculatePlanProgress,
  calculateMilestoneProgress,
} from '../services/learningPlansService'
import { getTasks, updateTask, createTask } from '../services/tasksService'
import { getSubjects } from '../services/subjectsService'
import { formatDate, cn } from '../lib/utils'
import { fadeUp, staggerContainer, staggerItem } from '../lib/motion'

export default function LearningPlanDetailPage() {
  const { planId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [plan, setPlan] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [tasks, setTasks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Plan Edit Modal
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [planDesc, setPlanDesc] = useState('')
  const [planTargetDate, setPlanTargetDate] = useState('')
  const [planStatus, setPlanStatus] = useState('active')
  const [planSaveLoading, setPlanSaveLoading] = useState(false)
  const [planSaveError, setPlanSaveError] = useState('')

  // Plan Delete Dialog
  const [deletePlanDialogOpen, setDeletePlanDialogOpen] = useState(false)
  const [deletePlanLoading, setDeletePlanLoading] = useState(false)

  // Milestone Create/Edit Modal
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDesc, setMilestoneDesc] = useState('')
  const [milestonePosition, setMilestonePosition] = useState('1')
  const [milestoneTargetDate, setMilestoneTargetDate] = useState('')
  const [milestoneStatus, setMilestoneStatus] = useState('pending')
  const [milestoneSaveLoading, setMilestoneSaveLoading] = useState(false)
  const [milestoneSaveError, setMilestoneSaveError] = useState('')

  // Milestone Delete Dialog
  const [deleteMilestoneDialogOpen, setDeleteMilestoneDialogOpen] = useState(false)
  const [milestoneToDelete, setMilestoneToDelete] = useState(null)
  const [deleteMilestoneLoading, setDeleteMilestoneLoading] = useState(false)

  // Task Modal (for creating / editing linked tasks)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [defaultMilestoneIdForTask, setDefaultMilestoneIdForTask] = useState(null)

  // Fetch plan, milestones, tasks, and subjects
  useEffect(() => {
    let ignore = false

    async function loadData() {
      if (!user?.id || !planId) return
      setLoading(true)
      setError('')

      try {
        const [planRes, milestonesRes, tasksRes, subsRes] = await Promise.all([
          getLearningPlanById(planId, user.id),
          getMilestonesForPlan(planId, user.id),
          getTasks(user.id),
          getSubjects(user.id),
        ])

        if (ignore) return

        if (planRes.error) {
          setError(planRes.error.message || 'Learning plan not found.')
        } else {
          setPlan(planRes.data)
        }

        if (milestonesRes.data) setMilestones(milestonesRes.data)
        if (tasksRes.data) setTasks(tasksRes.data)
        if (subsRes.data) setSubjects(subsRes.data)
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load plan details.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [user, planId, reloadKey])

  // Plan Edit Handlers
  function handleOpenEditPlan() {
    if (!plan) return
    setPlanTitle(plan.title || '')
    setPlanDesc(plan.description || '')
    setPlanTargetDate(plan.target_date || '')
    setPlanStatus(plan.status || 'active')
    setPlanSaveError('')
    setEditPlanModalOpen(true)
  }

  async function handleSavePlan(e) {
    e.preventDefault()
    if (!user?.id || !plan) return

    const cleanTitle = planTitle.trim()
    if (!cleanTitle) {
      setPlanSaveError('Plan title is required.')
      return
    }

    setPlanSaveLoading(true)
    setPlanSaveError('')

    try {
      const res = await updateLearningPlan({
        id: plan.id,
        userId: user.id,
        title: cleanTitle,
        description: planDesc.trim() || null,
        targetDate: planTargetDate || null,
        status: planStatus,
      })
      if (res.error) throw res.error

      setPlan(res.data)
      setEditPlanModalOpen(false)
    } catch (err) {
      setPlanSaveError(err instanceof Error ? err.message : 'Failed to update plan.')
    } finally {
      setPlanSaveLoading(false)
    }
  }

  async function handleDeletePlanConfirm() {
    if (!user?.id || !plan) return
    setDeletePlanLoading(true)

    try {
      const res = await deleteLearningPlan({ id: plan.id, userId: user.id })
      if (res.error) throw res.error
      navigate('/plans')
    } catch (err) {
      console.error('Failed to delete plan:', err)
    } finally {
      setDeletePlanLoading(false)
    }
  }

  // Milestone Handlers
  function handleOpenCreateMilestone() {
    setEditingMilestone(null)
    setMilestoneTitle('')
    setMilestoneDesc('')
    setMilestonePosition(String(milestones.length + 1))
    setMilestoneTargetDate('')
    setMilestoneStatus('pending')
    setMilestoneSaveError('')
    setMilestoneModalOpen(true)
  }

  function handleOpenEditMilestone(m) {
    setEditingMilestone(m)
    setMilestoneTitle(m.title || '')
    setMilestoneDesc(m.description || '')
    setMilestonePosition(String(m.position || 1))
    setMilestoneTargetDate(m.target_date || '')
    setMilestoneStatus(m.status || 'pending')
    setMilestoneSaveError('')
    setMilestoneModalOpen(true)
  }

  function handleOpenDeleteMilestone(m) {
    setMilestoneToDelete(m)
    setDeleteMilestoneDialogOpen(true)
  }

  async function handleSaveMilestone(e) {
    e.preventDefault()
    if (!user?.id || !plan) return

    const cleanTitle = milestoneTitle.trim()
    if (!cleanTitle) {
      setMilestoneSaveError('Milestone title is required.')
      return
    }

    setMilestoneSaveLoading(true)
    setMilestoneSaveError('')

    try {
      if (editingMilestone) {
        const res = await updateMilestone({
          id: editingMilestone.id,
          userId: user.id,
          title: cleanTitle,
          description: milestoneDesc.trim() || null,
          position: Number(milestonePosition) || 1,
          targetDate: milestoneTargetDate || null,
          status: milestoneStatus,
        })
        if (res.error) throw res.error
      } else {
        const res = await createMilestone({
          planId: plan.id,
          userId: user.id,
          title: cleanTitle,
          description: milestoneDesc.trim() || null,
          position: Number(milestonePosition) || 1,
          targetDate: milestoneTargetDate || null,
          status: milestoneStatus,
        })
        if (res.error) throw res.error
      }

      setMilestoneModalOpen(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setMilestoneSaveError(err instanceof Error ? err.message : 'Failed to save milestone.')
    } finally {
      setMilestoneSaveLoading(false)
    }
  }

  async function handleDeleteMilestoneConfirm() {
    if (!user?.id || !milestoneToDelete) return
    setDeleteMilestoneLoading(true)

    try {
      const res = await deleteMilestone({ id: milestoneToDelete.id, userId: user.id })
      if (res.error) throw res.error

      setDeleteMilestoneDialogOpen(false)
      setMilestoneToDelete(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to delete milestone:', err)
    } finally {
      setDeleteMilestoneLoading(false)
    }
  }

  async function handleToggleMilestoneStatus(m) {
    if (!user?.id) return
    const nextStatus = m.status === 'completed' ? 'in_progress' : 'completed'

    try {
      await updateMilestone({
        id: m.id,
        userId: user.id,
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
      })
      setReloadKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to update milestone status:', err)
    }
  }

  // Task Handlers
  async function handleToggleTask(task) {
    if (!user?.id) return
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'

    try {
      await updateTask({
        id: task.id,
        userId: user.id,
        title: task.title,
        status: nextStatus,
      })
      setReloadKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  function handleAddTaskToMilestone(milestoneId) {
    setEditingTask(null)
    setDefaultMilestoneIdForTask(milestoneId)
    setTaskModalOpen(true)
  }

  async function handleSaveTask(taskPayload) {
    if (!user?.id) return

    try {
      if (editingTask) {
        await updateTask({
          id: editingTask.id,
          userId: user.id,
          ...taskPayload,
        })
      } else {
        await createTask({
          userId: user.id,
          planId: plan.id,
          milestoneId: defaultMilestoneIdForTask,
          ...taskPayload,
        })
      }
      setTaskModalOpen(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to save task:', err)
    }
  }

  const planProgress = useMemo(() => {
    return calculatePlanProgress(plan, milestones, tasks)
  }, [plan, milestones, tasks])

  if (loading) {
    return (
      <PageContainer width="wide">
        <div className="flex flex-col items-center justify-center py-24">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs text-muted">Loading plan...</p>
        </div>
      </PageContainer>
    )
  }

  if (error || !plan) {
    return (
      <PageContainer width="wide" className="space-y-4">
        <Link
          to="/plans"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Plans</span>
        </Link>
        <div className="rounded-2xl border border-danger/20 bg-danger/10 p-6 text-center text-danger">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-semibold">{error || 'Learning plan not found.'}</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide" className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/plans"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Learning Plans</span>
        </Link>
      </div>

      {/* Plan Header Card */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent border border-accent/30 capitalize">
                <Compass className="h-3 w-3" />
                {plan.status} Plan
              </span>

              {plan.target_date && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Target: {formatDate(plan.target_date)}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {plan.title}
            </h1>

            {plan.description && (
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleOpenEditPlan}
              className="gap-1.5 text-xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Plan</span>
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setDeletePlanDialogOpen(true)}
              className="p-2"
              aria-label="Delete plan"
              title="Delete plan"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar & Summary */}
        <div className="mt-6 pt-6 border-t border-border/80 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium text-muted">Overall Journey Progress</span>
            <span className="font-bold text-foreground">{planProgress.percentage}%</span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-raised border border-border/50">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${planProgress.percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>
              {planProgress.completedMilestonesCount} of {milestones.length} milestones completed
            </span>
            {planProgress.totalTasksCount > 0 && (
              <span>
                {planProgress.completedTasksCount} of {planProgress.totalTasksCount} tasks completed
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Milestones Header & Actions */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight sm:text-lg">
            Milestones & Checkpoints
          </h2>
          <p className="text-xs text-muted">
            Step-by-step sequence to accomplish this learning roadmap.
          </p>
        </div>

        <Button onClick={handleOpenCreateMilestone} size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>Add Milestone</span>
        </Button>
      </div>

      {/* Milestones Vertical Timeline */}
      {milestones.length === 0 ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-raised/30 py-12 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/8 mb-3">
            <Milestone className="h-6 w-6 text-accent" />
          </div>
          <p className="text-sm font-semibold text-foreground">No milestones added yet</p>
          <p className="mt-1 text-xs text-muted max-w-xs">
            Break down this roadmap into tangible milestone checkpoints like foundations, practice, and mastery.
          </p>
          <Button onClick={handleOpenCreateMilestone} size="sm" className="mt-4 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add First Milestone</span>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-border/60 before:hidden sm:before:block"
        >
          <AnimatePresence>
            {milestones.map((m, idx) => {
              const mProgress = calculateMilestoneProgress(m, tasks)
              const linkedTasks = tasks.filter((t) => t.milestone_id === m.id)
              const isCompleted = m.status === 'completed'

              return (
                <motion.div
                  key={m.id}
                  variants={staggerItem}
                  layout
                  className={cn(
                    'relative rounded-2xl border bg-surface p-5 transition-all sm:ml-8',
                    isCompleted
                      ? 'border-success/30 bg-surface/90'
                      : m.status === 'in_progress'
                        ? 'border-accent/40 bg-surface shadow-sm'
                        : 'border-border bg-surface',
                  )}
                >
                  {/* Timeline node icon (sm screens) */}
                  <div
                    className={cn(
                      'absolute -left-[45px] top-6 hidden h-7 w-7 items-center justify-center rounded-full border bg-surface text-xs font-bold sm:flex transition-colors',
                      isCompleted
                        ? 'border-success/50 bg-success/15 text-success'
                        : m.status === 'in_progress'
                          ? 'border-accent bg-accent-muted text-accent'
                          : 'border-border text-muted',
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : m.position || idx + 1}
                  </div>

                  {/* Header Row */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                          Checkpoint #{m.position || idx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleMilestoneStatus(m)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all cursor-pointer',
                            isCompleted
                              ? 'bg-success/15 text-success border-success/30 hover:bg-success/20'
                              : m.status === 'in_progress'
                                ? 'bg-accent/15 text-accent border-accent/30 hover:bg-accent/20'
                                : 'bg-muted/15 text-muted border-border hover:bg-muted/25',
                          )}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Completed</span>
                            </>
                          ) : m.status === 'in_progress' ? (
                            <>
                              <PlayCircle className="h-3 w-3" />
                              <span>In Progress</span>
                            </>
                          ) : (
                            <>
                              <Circle className="h-3 w-3" />
                              <span>Pending</span>
                            </>
                          )}
                        </button>

                        {m.target_date && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                            <CalendarDays className="h-3 w-3" />
                            Target: {formatDate(m.target_date)}
                          </span>
                        )}
                      </div>

                      <h3
                        className={cn(
                          'text-base font-semibold text-foreground',
                          isCompleted && 'line-through text-muted',
                        )}
                      >
                        {m.title}
                      </h3>

                      {m.description && (
                        <p className="text-xs text-muted leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>

                    {/* Milestone Actions */}
                    <div className="flex items-center gap-1 self-start pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddTaskToMilestone(m.id)}
                        className="h-7 px-2 text-[11px] gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Task</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditMilestone(m)}
                        aria-label="Edit milestone"
                        title="Edit"
                        className="rounded p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteMilestone(m)}
                        aria-label="Delete milestone"
                        title="Delete"
                        className="rounded p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Milestone Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-border/50 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">
                        {linkedTasks.length > 0
                          ? `${mProgress.completedCount} of ${mProgress.totalCount} tasks completed`
                          : isCompleted
                            ? 'Milestone completed'
                            : 'No linked tasks'}
                      </span>
                      <span className="font-semibold text-foreground">{mProgress.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised border border-border/30">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isCompleted ? 'bg-success' : 'bg-accent',
                        )}
                        style={{ width: `${mProgress.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Linked Tasks List */}
                  {linkedTasks.length > 0 && (
                    <div className="mt-3.5 space-y-1.5 rounded-xl bg-surface-raised/40 p-2.5 border border-border/40">
                      <span className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                        Linked Tasks ({linkedTasks.length})
                      </span>
                      {linkedTasks.map((t) => {
                        const isTaskCompleted = t.status === 'completed'
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-surface px-2.5 py-1.5 border border-border/40 text-xs transition-colors hover:border-border"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(t)}
                                aria-label={isTaskCompleted ? 'Mark pending' : 'Mark completed'}
                                className="text-accent hover:scale-105 transition-transform"
                              >
                                {isTaskCompleted ? (
                                  <CheckSquare className="h-3.5 w-3.5 text-success" />
                                ) : (
                                  <Square className="h-3.5 w-3.5 text-muted" />
                                )}
                              </button>
                              <span
                                className={cn(
                                  'truncate font-medium text-foreground',
                                  isTaskCompleted && 'line-through text-muted',
                                )}
                              >
                                {t.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {t.priority && (
                                <Badge variant={t.priority} className="text-[9px] py-0 px-1">
                                  {t.priority}
                                </Badge>
                              )}
                              {t.due_date && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(t.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit Plan Modal */}
      <Modal
        open={editPlanModalOpen}
        onClose={() => setEditPlanModalOpen(false)}
        title="Edit Learning Plan"
        description="Update your plan details and targets."
      >
        <form onSubmit={handleSavePlan} className="p-6 space-y-4">
          {planSaveError && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{planSaveError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="edit-plan-title" className="block text-xs font-medium text-foreground">
              Plan Title <span className="text-danger">*</span>
            </label>
            <Input
              id="edit-plan-title"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              disabled={planSaveLoading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-plan-desc" className="block text-xs font-medium text-foreground">
              Description / Objectives
            </label>
            <Textarea
              id="edit-plan-desc"
              rows={3}
              value={planDesc}
              onChange={(e) => setPlanDesc(e.target.value)}
              disabled={planSaveLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="edit-plan-date" className="block text-xs font-medium text-foreground">
                Target Completion Date
              </label>
              <Input
                id="edit-plan-date"
                type="date"
                value={planTargetDate}
                onChange={(e) => setPlanTargetDate(e.target.value)}
                disabled={planSaveLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-plan-status" className="block text-xs font-medium text-foreground">
                Status
              </label>
              <select
                id="edit-plan-status"
                value={planStatus}
                onChange={(e) => setPlanStatus(e.target.value)}
                disabled={planSaveLoading}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditPlanModalOpen(false)}
              disabled={planSaveLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={planSaveLoading} className="text-xs">
              {planSaveLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Milestone Modal */}
      <Modal
        open={milestoneModalOpen}
        onClose={() => setMilestoneModalOpen(false)}
        title={editingMilestone ? 'Edit Milestone' : 'Add Milestone Checkpoint'}
        description="Milestones represent major checkpoints in your learning journey."
      >
        <form onSubmit={handleSaveMilestone} className="p-6 space-y-4">
          {milestoneSaveError && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{milestoneSaveError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="m-title" className="block text-xs font-medium text-foreground">
              Milestone Title <span className="text-danger">*</span>
            </label>
            <Input
              id="m-title"
              placeholder="e.g. Master Arrays, LinkedLists & Stacks"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              disabled={milestoneSaveLoading}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="m-desc" className="block text-xs font-medium text-foreground">
              Description (Optional)
            </label>
            <Textarea
              id="m-desc"
              rows={2}
              placeholder="What core competencies or projects define completing this milestone?"
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              disabled={milestoneSaveLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="m-pos" className="block text-xs font-medium text-foreground">
                Order Position
              </label>
              <Input
                id="m-pos"
                type="number"
                min="1"
                value={milestonePosition}
                onChange={(e) => setMilestonePosition(e.target.value)}
                disabled={milestoneSaveLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="m-date" className="block text-xs font-medium text-foreground">
                Target Date
              </label>
              <Input
                id="m-date"
                type="date"
                value={milestoneTargetDate}
                onChange={(e) => setMilestoneTargetDate(e.target.value)}
                disabled={milestoneSaveLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="m-status" className="block text-xs font-medium text-foreground">
                Status
              </label>
              <select
                id="m-status"
                value={milestoneStatus}
                onChange={(e) => setMilestoneStatus(e.target.value)}
                disabled={milestoneSaveLoading}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMilestoneModalOpen(false)}
              disabled={milestoneSaveLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={milestoneSaveLoading} className="text-xs">
              {milestoneSaveLoading ? <LoadingSpinner size="sm" /> : editingMilestone ? 'Save Milestone' : 'Add Milestone'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={editingTask}
        subjects={subjects}
        onSave={handleSaveTask}
      />

      {/* Delete Plan Confirmation Dialog */}
      <ConfirmDialog
        open={deletePlanDialogOpen}
        onClose={() => setDeletePlanDialogOpen(false)}
        onConfirm={handleDeletePlanConfirm}
        loading={deletePlanLoading}
        title="Delete Learning Plan?"
        description={`Are you sure you want to delete "${plan?.title}"? All milestones in this plan will be removed. Your existing tasks will NOT be deleted.`}
        confirmText="Delete Plan"
        variant="danger"
      />

      {/* Delete Milestone Confirmation Dialog */}
      <ConfirmDialog
        open={deleteMilestoneDialogOpen}
        onClose={() => setDeleteMilestoneDialogOpen(false)}
        onConfirm={handleDeleteMilestoneConfirm}
        loading={deleteMilestoneLoading}
        title="Delete Milestone?"
        description={`Are you sure you want to delete milestone "${milestoneToDelete?.title}"? Linked tasks will remain intact.`}
        confirmText="Delete Milestone"
        variant="danger"
      />
    </PageContainer>
  )
}
