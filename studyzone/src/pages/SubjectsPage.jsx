import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, BookOpen, Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingSpinner'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { SubjectCard } from '../components/subjects/SubjectCard'
import { SubjectModal } from '../components/subjects/SubjectModal'
import { DeleteSubjectModal } from '../components/subjects/DeleteSubjectModal'
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../services/subjectsService'
import { getNotes } from '../services/notesService'
import { bannerVariant, staggerContainer } from '../lib/motion'

export default function SubjectsPage() {
  const { user } = useAuth()

  const [subjects, setSubjects] = useState([])
  const [noteCountMap, setNoteCountMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Modal States
  const [modalState, setModalState] = useState({
    isOpen: false,
    subject: null,
  })
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    subject: null,
  })

  // Action status states
  const [actionLoading, setActionLoading] = useState(false)
  const [bannerError, setBannerError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadData() {
      if (!user?.id) return

      try {
        const [subRes, notesRes] = await Promise.all([
          getSubjects(user.id),
          getNotes(user.id),
        ])

        if (!ignore) {
          if (subRes.error) {
            setFetchError(subRes.error.message || 'Unable to load subjects from database.')
          } else {
            setSubjects(subRes.data || [])
            setFetchError('')
          }

          const countMap = new Map()
          for (const n of notesRes?.data || []) {
            if (n.subjectId) {
              countMap.set(n.subjectId, (countMap.get(n.subjectId) || 0) + 1)
            }
          }
          setNoteCountMap(countMap)
          setLoading(false)
        }
      } catch {
        if (!ignore) {
          setFetchError('Unable to load subjects.')
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [user, reloadKey])

  function handleRetry() {
    setLoading(true)
    setFetchError('')
    setReloadKey((prev) => prev + 1)
  }

  // Open Create Modal
  function handleOpenCreate() {
    setBannerError('')
    setModalState({ isOpen: true, subject: null })
  }

  // Open Edit Modal
  function handleOpenEdit(subject) {
    setBannerError('')
    setModalState({ isOpen: true, subject })
  }

  // Open Delete Modal
  function handleOpenDelete(subject) {
    setBannerError('')
    setDeleteModalState({ isOpen: true, subject })
  }

  // Handle Save (Create or Update)
  async function handleSaveSubject({ name, description, color }) {
    if (!user?.id) return
    setActionLoading(true)
    setBannerError('')

    if (modalState.subject) {
      // Edit mode
      const { data, error } = await updateSubject({
        id: modalState.subject.id,
        userId: user.id,
        name,
        description,
        color,
      })

      if (error) {
        setBannerError(error.message || 'Failed to update subject.')
      } else if (data) {
        setSubjects((prev) =>
          prev.map((item) => (item.id === data.id ? data : item)),
        )
        setModalState({ isOpen: false, subject: null })
      }
    } else {
      // Create mode
      const { data, error } = await createSubject({
        userId: user.id,
        name,
        description,
        color,
      })

      if (error) {
        setBannerError(error.message || 'Failed to create subject.')
      } else if (data) {
        setSubjects((prev) => [...prev, data])
        setModalState({ isOpen: false, subject: null })
      }
    }
    setActionLoading(false)
  }

  // Handle Delete Confirmation
  async function handleConfirmDelete() {
    if (!user?.id || !deleteModalState.subject) return
    setActionLoading(true)
    setBannerError('')

    const subjectToDelete = deleteModalState.subject
    const { error } = await deleteSubject({
      id: subjectToDelete.id,
      userId: user.id,
    })

    if (error) {
      setBannerError(error.message || 'Failed to delete subject.')
    } else {
      setSubjects((prev) => prev.filter((item) => item.id !== subjectToDelete.id))
      setDeleteModalState({ isOpen: false, subject: null })
    }
    setActionLoading(false)
  }

  return (
    <PageContainer width="wide" className="space-y-5">
      <PageHeader
        title="Subjects & Areas"
        description="Organize your subjects, skills, courses, and exam topics in one place."
        icon={BookOpen}
        actions={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
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

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading what you're learning..." />
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger border border-danger/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Failed to load subjects</h3>
          <p className="max-w-md text-sm text-muted">{fetchError}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            className="gap-2 mt-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Start by adding what you're learning"
          description="Add a subject, programming skill, exam topic, course, or certification to organize your tasks and study plans."
          actionLabel="Add Subject"
          onAction={handleOpenCreate}
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              noteCount={noteCountMap.get(subject.id) || 0}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </motion.div>
      )}

      {/* Create / Edit Subject Modal */}
      <SubjectModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, subject: null })}
        onSave={handleSaveSubject}
        subject={modalState.subject}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteSubjectModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, subject: null })}
        onConfirm={handleConfirmDelete}
        subject={deleteModalState.subject}
        loading={actionLoading}
      />
    </PageContainer>
  )
}
