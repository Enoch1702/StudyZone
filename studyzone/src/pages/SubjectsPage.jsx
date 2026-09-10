import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, BookOpen, Plus } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
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
import { getTasks } from '../services/tasksService'
import { getFlashcardDecks } from '../services/flashcardsService'
import { getStudySessions } from '../services/studySessionsService'
import { bannerVariant, staggerContainer } from '../lib/motion'

export default function SubjectsPage() {
  const { user } = useAuth()

  const [subjects, setSubjects] = useState([])
  const [noteCountMap, setNoteCountMap] = useState(new Map())
  const [taskCountMap, setTaskCountMap] = useState(new Map())
  const [flashcardCountMap, setFlashcardCountMap] = useState(new Map())
  const [studyMinutesMap, setStudyMinutesMap] = useState(new Map())
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
        const [subRes, notesRes, tasksRes, decksRes, sessionsRes] = await Promise.all([
          getSubjects(user.id),
          getNotes(user.id),
          getTasks(user.id),
          getFlashcardDecks(user.id),
          getStudySessions(user.id),
        ])

        if (!ignore) {
          if (subRes.error) {
            setFetchError(subRes.error.message || 'Unable to load subjects from database.')
          } else {
            setSubjects(subRes.data || [])
            setFetchError('')
          }

          // Notes count per subject
          const nMap = new Map()
          for (const n of notesRes?.data || []) {
            if (n.subjectId || n.subject_id) {
              const sid = n.subjectId || n.subject_id
              nMap.set(sid, (nMap.get(sid) || 0) + 1)
            }
          }
          setNoteCountMap(nMap)

          // Active/Pending Tasks count per subject
          const tMap = new Map()
          for (const t of tasksRes?.data || []) {
            if (t.subject_id && t.status !== 'completed' && t.status !== 'archived') {
              tMap.set(t.subject_id, (tMap.get(t.subject_id) || 0) + 1)
            }
          }
          setTaskCountMap(tMap)

          // Flashcard decks count per subject
          const dMap = new Map()
          for (const d of decksRes?.data || []) {
            if (d.subject_id) {
              dMap.set(d.subject_id, (dMap.get(d.subject_id) || 0) + 1)
            }
          }
          setFlashcardCountMap(dMap)

          // Study minutes per subject
          const sMap = new Map()
          for (const s of sessionsRes?.data || []) {
            if (s.subject_id && s.duration_minutes) {
              sMap.set(s.subject_id, (sMap.get(s.subject_id) || 0) + Number(s.duration_minutes))
            }
          }
          setStudyMinutesMap(sMap)

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
        description="Your central learning containers. Link notes, tasks, flashcards, and focus sessions to keep your knowledge organized."
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
        <ErrorState
          title="Failed to load subjects"
          message={fetchError}
          onRetry={handleRetry}
        />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Add your first learning container"
          description="Create a subject, course, or topic to organize your notes, tasks, flashcard decks, and focus sessions."
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
              taskCount={taskCountMap.get(subject.id) || 0}
              flashcardCount={flashcardCountMap.get(subject.id) || 0}
              studyMinutes={studyMinutesMap.get(subject.id) || 0}
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
