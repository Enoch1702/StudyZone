import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertCircle,
  CalendarDays,
  FileText,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { DeadlineUrgency } from '../components/ui/DeadlineUrgency'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { DeadlineModal } from '../components/deadlines/DeadlineModal'
import { DeleteDeadlineModal } from '../components/deadlines/DeleteDeadlineModal'
import {
  getDeadlines,
  createDeadline,
  updateDeadline,
  deleteDeadline,
} from '../services/deadlinesService'
import { getSubjects } from '../services/subjectsService'
import { formatDate, getDeadlineUrgency } from '../lib/utils'
import { bannerVariant, staggerContainer, staggerItem } from '../lib/motion'

/** Map deadline_type to a Lucide icon */
function TypeIcon({ type }) {
  if (type === 'exam' || type === 'quiz') return <GraduationCap className="h-4 w-4 text-muted" />
  if (type === 'presentation') return <Layers className="h-4 w-4 text-muted" />
  return <FileText className="h-4 w-4 text-muted" />
}

/** Urgency level derived from due_date — used for the urgency filter */
function urgencyLevel(dueDateStr) {
  return getDeadlineUrgency(dueDateStr).level
}

export default function DeadlinesPage() {
  const { user } = useAuth()

  // ─── Data state ────────────────────────────────────────────────
  const [deadlines, setDeadlines] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // ─── Filter state ──────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')

  // ─── Modal state ───────────────────────────────────────────────
  const [modalState, setModalState] = useState({ isOpen: false, deadline: null })
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, deadline: null })

  // ─── Action state ──────────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(false)
  const [bannerError, setBannerError] = useState('')

  // ─── Fetch deadlines + subjects together ───────────────────────
  useEffect(() => {
    let ignore = false

    async function loadData() {
      if (!user?.id) return

      setLoading(true)
      setFetchError('')

      const [deadlinesResult, subjectsResult] = await Promise.all([
        getDeadlines(user.id),
        getSubjects(user.id),
      ])

      if (ignore) return

      if (deadlinesResult.error) {
        setFetchError(deadlinesResult.error.message || 'Unable to load deadlines.')
      } else {
        setDeadlines(deadlinesResult.data || [])
      }

      // Subjects failure is non-fatal — deadlines still render without subject labels
      if (!subjectsResult.error) {
        setSubjects(subjectsResult.data || [])
      }

      setLoading(false)
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [user, reloadKey])

  // ─── Subject lookup helper ─────────────────────────────────────
  function subjectName(subjectId) {
    if (!subjectId) return ''
    const match = subjects.find((s) => s.id === subjectId)
    return match ? match.name : ''
  }

  // ─── Client-side filtering ─────────────────────────────────────
  const filteredDeadlines = useMemo(() => {
    return deadlines.filter((dl) => {
      const name = subjectName(dl.subject_id)

      const matchesSearch =
        search === '' ||
        dl.title.toLowerCase().includes(search.toLowerCase()) ||
        name.toLowerCase().includes(search.toLowerCase())

      const matchesType = typeFilter === 'all' || dl.deadline_type === typeFilter

      const matchesSubject = subjectFilter === 'all' || dl.subject_id === subjectFilter

      const matchesUrgency =
        urgencyFilter === 'all' || urgencyLevel(dl.due_date) === urgencyFilter

      return matchesSearch && matchesType && matchesSubject && matchesUrgency
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlines, subjects, search, typeFilter, subjectFilter, urgencyFilter])

  // ─── Retry ────────────────────────────────────────────────────
  function handleRetry() {
    setReloadKey((prev) => prev + 1)
  }

  // ─── Modal openers ────────────────────────────────────────────
  function handleOpenCreate() {
    setBannerError('')
    setModalState({ isOpen: true, deadline: null })
  }

  function handleOpenEdit(deadline) {
    setBannerError('')
    setModalState({ isOpen: true, deadline })
  }

  function handleOpenDelete(deadline) {
    setBannerError('')
    setDeleteModalState({ isOpen: true, deadline })
  }

  // ─── Save (Create or Edit) ────────────────────────────────────
  async function handleSaveDeadline(formData) {
    if (!user?.id) return
    setActionLoading(true)
    setBannerError('')

    if (modalState.deadline) {
      const { data, error } = await updateDeadline({
        id: modalState.deadline.id,
        userId: user.id,
        ...formData,
      })

      if (error) {
        setBannerError(error.message || 'Failed to update deadline.')
      } else if (data) {
        setDeadlines((prev) => prev.map((d) => (d.id === data.id ? data : d)))
        setModalState({ isOpen: false, deadline: null })
      }
    } else {
      const { data, error } = await createDeadline({
        userId: user.id,
        ...formData,
      })

      if (error) {
        setBannerError(error.message || 'Failed to create deadline.')
      } else if (data) {
        // Insert and re-sort by due_date so the list stays ordered
        setDeadlines((prev) =>
          [...prev, data].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
        )
        setModalState({ isOpen: false, deadline: null })
      }
    }

    setActionLoading(false)
  }

  // ─── Delete ───────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!user?.id || !deleteModalState.deadline) return
    setActionLoading(true)
    setBannerError('')

    const toDelete = deleteModalState.deadline
    const { error } = await deleteDeadline({
      id: toDelete.id,
      userId: user.id,
    })

    if (error) {
      setBannerError(error.message || 'Failed to delete deadline.')
    } else {
      setDeadlines((prev) => prev.filter((d) => d.id !== toDelete.id))
      setDeleteModalState({ isOpen: false, deadline: null })
    }

    setActionLoading(false)
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <PageContainer width="wide" className="space-y-5">
      <PageHeader
        description="Track exams and assignment due dates across all your subjects."
        actions={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Deadline</span>
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
              placeholder="Search deadlines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search deadlines"
            />
          </div>

          {/* Type filter */}
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="project">Project</option>
            <option value="quiz">Quiz</option>
            <option value="presentation">Presentation</option>
            <option value="other">Other</option>
          </Select>

          {/* Subject filter — uses real subjects from Supabase */}
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

          {/* Urgency filter */}
          <Select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            aria-label="Filter by urgency"
          >
            <option value="all">All urgencies</option>
            <option value="urgent">Urgent</option>
            <option value="approaching">Approaching</option>
            <option value="normal">On Track</option>
          </Select>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <LoadingState message="Loading your deadlines..." />
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger border border-danger/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Failed to load deadlines</h3>
          <p className="max-w-md text-sm text-muted">{fetchError}</p>
          <Button variant="secondary" size="sm" onClick={handleRetry} className="gap-2 mt-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : deadlines.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No deadlines scheduled"
          description="Add deadlines to keep track of exams, assignments, and important dates."
          actionLabel="Add Deadline"
          onAction={handleOpenCreate}
        />
      ) : filteredDeadlines.length === 0 ? (
        <EmptyState
          title="No deadlines match your filters"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {filteredDeadlines.map((deadline) => {
            const sName = subjectName(deadline.subject_id)

            return (
              <motion.article
                key={deadline.id}
                variants={staggerItem}
                layout
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-4 transition-all duration-200 hover:border-border/80 hover:bg-surface-raised/30 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                {/* Left: icon + title + subject + type badge */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised border border-border/50">
                    <TypeIcon type={deadline.deadline_type} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{deadline.title}</h3>
                    <p className="mt-0.5 text-xs text-muted">
                      {sName || <span className="italic text-muted-foreground/60">No subject</span>}
                    </p>
                    <Badge variant="default" className="mt-2 capitalize text-[10px]">
                      {deadline.deadline_type}
                    </Badge>
                  </div>
                </div>

                {/* Right: date + urgency + actions */}
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                  <div className="flex flex-col gap-1.5 sm:items-end">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(deadline.due_date)}
                    </span>
                    {/* Urgency is calculated dynamically from the current date */}
                    <DeadlineUrgency date={deadline.due_date} />
                  </div>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-1 sm:mt-1">
                    <button
                      type="button"
                      aria-label={`Edit ${deadline.title}`}
                      onClick={() => handleOpenEdit(deadline)}
                      className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-foreground transition-colors active:scale-95"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${deadline.title}`}
                      onClick={() => handleOpenDelete(deadline)}
                      className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      )}

      {/* Create / Edit Deadline Modal */}
      <DeadlineModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, deadline: null })}
        onSave={handleSaveDeadline}
        deadline={modalState.deadline}
        subjects={subjects}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDeadlineModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, deadline: null })}
        onConfirm={handleConfirmDelete}
        deadline={deleteModalState.deadline}
        loading={actionLoading}
      />
    </PageContainer>
  )
}
