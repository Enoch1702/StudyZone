import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Compass,
  Edit2,
  Milestone,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  getLearningPlans,
  createLearningPlan,
  updateLearningPlan,
  deleteLearningPlan,
  calculatePlanProgress,
} from '../services/learningPlansService'
import { getTasks } from '../services/tasksService'
import { supabase } from '../lib/supabase'
import { formatDate, cn } from '../lib/utils'
import { fadeUp, staggerContainer, staggerItem } from '../lib/motion'

const STATUS_TABS = [
  { id: 'all', label: 'All Plans' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'paused', label: 'Paused' },
  { id: 'archived', label: 'Archived' },
]

export default function LearningPlansPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [plans, setPlans] = useState([])
  const [milestones, setMilestones] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planFormLoading, setPlanFormLoading] = useState(false)
  const [planFormError, setPlanFormError] = useState('')

  // Form fields
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTargetDate, setFormTargetDate] = useState('')
  const [formStatus, setFormStatus] = useState('active')

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch all plans, milestones, and tasks for the user
  useEffect(() => {
    let ignore = false

    async function loadData() {
      if (!user?.id) return
      setLoading(true)
      setError('')

      try {
        const [plansRes, taskRes] = await Promise.all([
          getLearningPlans(user.id),
          getTasks(user.id),
        ])

        // Fetch all milestones belonging to user
        const { data: milestonesData, error: mErr } = await supabase
          .from('learning_milestones')
          .select('*')
          .eq('user_id', user.id)

        if (ignore) return

        if (plansRes.error) setError(plansRes.error.message)
        else setPlans(plansRes.data || [])

        if (mErr) console.warn('Could not load milestones:', mErr)
        else setMilestones(milestonesData || [])

        if (taskRes.data) setTasks(taskRes.data)
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load learning plans.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [user, reloadKey])

  function handleOpenCreateModal() {
    setEditingPlan(null)
    setFormTitle('')
    setFormDescription('')
    setFormTargetDate('')
    setFormStatus('active')
    setPlanFormError('')
    setModalOpen(true)
  }

  function handleOpenEditModal(plan, e) {
    e?.stopPropagation()
    setEditingPlan(plan)
    setFormTitle(plan.title || '')
    setFormDescription(plan.description || '')
    setFormTargetDate(plan.target_date || '')
    setFormStatus(plan.status || 'active')
    setPlanFormError('')
    setModalOpen(true)
  }

  function handleOpenDeleteDialog(plan, e) {
    e?.stopPropagation()
    setPlanToDelete(plan)
    setDeleteConfirmOpen(true)
  }

  async function handleSavePlan(e) {
    e.preventDefault()
    if (!user?.id) return

    const cleanTitle = formTitle.trim()
    if (!cleanTitle) {
      setPlanFormError('Please enter a plan title.')
      return
    }

    setPlanFormLoading(true)
    setPlanFormError('')

    try {
      if (editingPlan) {
        const res = await updateLearningPlan({
          id: editingPlan.id,
          userId: user.id,
          title: cleanTitle,
          description: formDescription.trim() || null,
          targetDate: formTargetDate || null,
          status: formStatus,
        })
        if (res.error) throw res.error
      } else {
        const res = await createLearningPlan({
          userId: user.id,
          title: cleanTitle,
          description: formDescription.trim() || null,
          targetDate: formTargetDate || null,
          status: formStatus,
        })
        if (res.error) throw res.error
      }

      setModalOpen(false)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setPlanFormError(err instanceof Error ? err.message : 'Failed to save learning plan.')
    } finally {
      setPlanFormLoading(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!planToDelete || !user?.id) return
    setDeleteLoading(true)

    try {
      const res = await deleteLearningPlan({ id: planToDelete.id, userId: user.id })
      if (res.error) throw res.error

      setDeleteConfirmOpen(false)
      setPlanToDelete(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to delete plan:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredPlans = useMemo(() => {
    if (activeTab === 'all') return plans
    return plans.filter((p) => p.status === activeTab)
  }, [plans, activeTab])

  return (
    <PageContainer width="wide" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/8">
            <Compass className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Learning Plans
            </h1>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              Turn big learning goals into clear milestones and steady progress.
            </p>
          </div>
        </div>

        <Button onClick={handleOpenCreateModal} className="shrink-0 gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Create Plan</span>
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150',
              activeTab === tab.id
                ? 'bg-accent-muted text-accent font-semibold'
                : 'text-muted hover:bg-surface-raised hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-1.5 opacity-60">
                ({plans.filter((p) => p.status === tab.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-xs text-muted">Loading learning plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        /* Empty State */
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-raised/40 py-16 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/8 mb-4">
            <Compass className="h-7 w-7 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {activeTab === 'all' ? 'No learning plans yet' : `No ${activeTab} learning plans`}
          </h3>
          <p className="mt-1.5 max-w-sm text-xs text-muted leading-relaxed">
            {activeTab === 'all'
              ? 'Create a structured roadmap for your big goals like exam preparation, placement prep, or mastering a new skill.'
              : `You don't have any plans in the "${activeTab}" state.`}
          </p>
          {activeTab === 'all' && (
            <Button onClick={handleOpenCreateModal} className="mt-5 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Your First Plan</span>
            </Button>
          )}
        </motion.div>
      ) : (
        /* Plans Grid */
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filteredPlans.map((plan) => {
              const progress = calculatePlanProgress(plan, milestones, tasks)
              const planMilestones = milestones.filter((m) => m.plan_id === plan.id)

              return (
                <motion.div
                  key={plan.id}
                  variants={staggerItem}
                  layout
                  onClick={() => navigate(`/plans/${plan.id}`)}
                  className="group relative flex flex-col justify-between cursor-pointer rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-accent/40 hover:shadow-md hover:translate-y-[-2px]"
                >
                  <div>
                    {/* Top Row: status & actions */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <PlanStatusBadge status={plan.status} />

                      {/* Card menu */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(plan, e)}
                          aria-label="Edit plan"
                          title="Edit"
                          className="rounded p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteDialog(plan, e)}
                          aria-label="Delete plan"
                          title="Delete"
                          className="rounded p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-semibold text-foreground tracking-tight line-clamp-1 group-hover:text-accent transition-colors">
                      {plan.title}
                    </h3>
                    {plan.description && (
                      <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Section */}
                  <div className="mt-5 pt-4 border-t border-border/60 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted text-[11px] font-medium">Overall Progress</span>
                        <span className="font-semibold text-foreground">{progress.percentage}%</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised border border-border/40">
                        <motion.div
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta stats row */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span className="inline-flex items-center gap-1">
                        <Milestone className="h-3 w-3" />
                        {progress.completedMilestonesCount}/{planMilestones.length} milestones
                      </span>

                      {progress.totalTasksCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {progress.completedTasksCount}/{progress.totalTasksCount} tasks
                        </span>
                      ) : plan.target_date ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Target {formatDate(plan.target_date)}
                        </span>
                      ) : null}
                    </div>

                    {/* Next milestone prompt if available */}
                    {progress.nextMilestone && (
                      <div className="rounded-lg bg-surface-raised/60 p-2 text-[11px] border border-border/40 truncate">
                        <span className="text-muted">Next: </span>
                        <span className="font-medium text-foreground">{progress.nextMilestone.title}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create / Edit Plan Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? 'Edit Learning Plan' : 'Create Learning Plan'}
        description="Organize your major learning journey into measurable milestones."
      >
        <form onSubmit={handleSavePlan} className="p-6 space-y-4">
          {planFormError && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{planFormError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="plan-title" className="block text-xs font-medium text-foreground">
              Plan Title <span className="text-danger">*</span>
            </label>
            <Input
              id="plan-title"
              placeholder="e.g. Java & DSA Placement Preparation"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              disabled={planFormLoading}
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="plan-desc" className="block text-xs font-medium text-foreground">
              Description / Objective (Optional)
            </label>
            <Textarea
              id="plan-desc"
              rows={3}
              placeholder="What are the goals and key outcomes of this learning roadmap?"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={planFormLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Target Date */}
            <div className="space-y-1.5">
              <label htmlFor="plan-date" className="block text-xs font-medium text-foreground">
                Target Completion Date (Optional)
              </label>
              <Input
                id="plan-date"
                type="date"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
                disabled={planFormLoading}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label htmlFor="plan-status" className="block text-xs font-medium text-foreground">
                Status
              </label>
              <select
                id="plan-status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                disabled={planFormLoading}
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
              onClick={() => setModalOpen(false)}
              disabled={planFormLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={planFormLoading} className="text-xs">
              {planFormLoading ? <LoadingSpinner size="sm" /> : editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Learning Plan?"
        description={`Are you sure you want to delete "${planToDelete?.title}"? All milestones in this plan will be removed. Your existing tasks will NOT be deleted.`}
        confirmText="Delete Plan"
        variant="danger"
      />
    </PageContainer>
  )
}

/** Status Badge helper component */
function PlanStatusBadge({ status }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-semibold text-success border border-success/30">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      )
    case 'paused':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-[10px] font-semibold text-warning border border-warning/30">
          <PauseCircle className="h-3 w-3" />
          Paused
        </span>
      )
    case 'archived':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted/20 px-2.5 py-0.5 text-[10px] font-semibold text-muted border border-border">
          Archived
        </span>
      )
    case 'active':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent border border-accent/30">
          <PlayCircle className="h-3 w-3" />
          Active
        </span>
      )
  }
}
