import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Bold,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Code,
  Copy,
  FileText,
  Heading1,
  Heading2,
  HelpCircle,
  Italic,
  Layers,
  List,
  ListOrdered,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  Quote,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useAuth } from '../context/useAuth'
import { getSubjects } from '../services/subjectsService'
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  archiveNote,
  createSampleNote,
} from '../services/notesService'
import { createFlashcardDeck, createBulkFlashcards } from '../services/flashcardsService'
import { sendMessage } from '../services/aiService'
import { cn, formatDate } from '../lib/utils'

export default function NotesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // ─── Data State ────────────────────────────────────────────────
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // ─── Filter & Search State ─────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    () => searchParams.get('subjectId') || '',
  )
  const [showArchived, setShowArchived] = useState(false)

  // ─── Active Note / Editor State ────────────────────────────────
  const [activeNoteId, setActiveNoteId] = useState(() => searchParams.get('id') || null)
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [editorSummary, setEditorSummary] = useState('')
  const [editorSubjectId, setEditorSubjectId] = useState('')
  const [editorTags, setEditorTags] = useState([])
  const [newTagInput, setNewTagInput] = useState('')
  const [isEditorPinned, setIsEditorPinned] = useState(false)
  const [editorViewMode, setEditorViewMode] = useState('edit') // 'edit' or 'preview'

  // ─── Save & Draft State Tracking ───────────────────────────────
  const [saveStatus, setSaveStatus] = useState('saved') // 'saving', 'saved', 'unsaved', 'offline', 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null)
  const [recoveredDraft, setRecoveredDraft] = useState(null)
  const autoSaveTimerRef = useRef(null)
  const draftTimerRef = useRef(null)
  const textareaRef = useRef(null)

  // ─── Delete Confirmation Modal ─────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ─── AI Modal & Proposal States ────────────────────────────────
  const [aiMenuOpen, setAiMenuOpen] = useState(false)
  const [aiActionLoading, setAiActionLoading] = useState(false)
  const [aiProposalType, setAiProposalType] = useState(null) // 'summary', 'questions', 'explain', 'structure'
  const [aiProposalContent, setAiProposalContent] = useState('')
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [copiedProposal, setCopiedProposal] = useState(false)

  // ─── Flashcards from Note Generator State ──────────────────────
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)
  const [proposedFlashcards, setProposedFlashcards] = useState([])
  const [flashcardDeckTitle, setFlashcardDeckTitle] = useState('')
  const [savingCards, setSavingCards] = useState(false)
  const [flashcardSuccess, setFlashcardSuccess] = useState(false)

  // ─── Subject Map ───────────────────────────────────────────────
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  // Helper to load note details into editor with local draft recovery check
  const loadNoteIntoEditor = useCallback((note) => {
    if (!note) return
    setActiveNoteId(note.id)
    setRecoveredDraft(null)

    // 1. Load server version into editor
    setEditorTitle(note.title || '')
    setEditorContent(note.content || '')
    setEditorSummary(note.summary || '')
    setEditorSubjectId(note.subjectId || '')
    setEditorTags(Array.isArray(note.tags) ? note.tags : [])
    setIsEditorPinned(Boolean(note.isPinned))
    setEditorViewMode('edit')
    setSaveStatus('saved')
    setLastSavedTime(new Date(note.updatedAt || note.createdAt))

    // 2. Check for local unsaved draft
    try {
      const rawDraft = localStorage.getItem(`studyzone_draft_note_${note.id}`)
      if (rawDraft) {
        const draft = JSON.parse(rawDraft)
        if (draft) {
          const titleDiffers = (draft.title ?? '') !== (note.title || '')
          const contentDiffers = (draft.content ?? '') !== (note.content || '')
          const summaryDiffers = (draft.summary ?? '') !== (note.summary || '')

          if (titleDiffers || contentDiffers || summaryDiffers) {
            setRecoveredDraft(draft)
          }
        }
      }
    } catch {
      // ignore
    }
  }, [])

  function handleRestoreDraft() {
    if (!recoveredDraft) return
    if (recoveredDraft.title !== undefined) setEditorTitle(recoveredDraft.title)
    if (recoveredDraft.content !== undefined) setEditorContent(recoveredDraft.content)
    if (recoveredDraft.summary !== undefined) setEditorSummary(recoveredDraft.summary)
    if (recoveredDraft.subjectId !== undefined) setEditorSubjectId(recoveredDraft.subjectId)
    if (recoveredDraft.tags !== undefined) setEditorTags(recoveredDraft.tags)
    setSaveStatus('unsaved')
    setRecoveredDraft(null)
  }

  function handleDiscardDraft() {
    if (activeNoteId) {
      try {
        localStorage.removeItem(`studyzone_draft_note_${activeNoteId}`)
      } catch {
        // ignore
      }
    }
    setRecoveredDraft(null)
  }

  // ─── Fetch Data ────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [notesRes, subRes] = await Promise.all([
        getNotes(user.id, {
          subjectId: selectedSubjectId || null,
          searchQuery: searchQuery || '',
          sortBy: 'updated_desc',
          includeArchived: showArchived,
        }),
        getSubjects(user.id),
      ])

      if (notesRes.data) {
        setNotes(notesRes.data)
      }
      if (subRes.data) {
        setSubjects(subRes.data)
      }
      setFetchError('')
    } catch {
      setFetchError('Unable to load notes. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [user, selectedSubjectId, searchQuery, showArchived])

  // Initial load and URL param sync
  useEffect(() => {
    let ignore = false

    async function initialLoad() {
      if (!user?.id) return
      setLoading(true)
      try {
        const [notesRes, subRes] = await Promise.all([
          getNotes(user.id, {
            subjectId: selectedSubjectId || null,
            searchQuery: searchQuery || '',
            sortBy: 'updated_desc',
            includeArchived: showArchived,
          }),
          getSubjects(user.id),
        ])

        if (!ignore) {
          const loadedNotes = notesRes.data || []
          setNotes(loadedNotes)
          setSubjects(subRes.data || [])

          const urlNoteId = searchParams.get('id')
          if (urlNoteId) {
            const found = loadedNotes.find((n) => n.id === urlNoteId)
            if (found) {
              loadNoteIntoEditor(found)
            }
          } else if (loadedNotes.length > 0 && window.innerWidth >= 1024) {
            // Auto-select first note on wide screens
            loadNoteIntoEditor(loadedNotes[0])
            setSearchParams({ id: loadedNotes[0].id }, { replace: true })
          }
        }
      } catch {
        if (!ignore) {
          setFetchError('Unable to load notes.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    initialLoad()

    return () => {
      ignore = true
    }
  }, [user, selectedSubjectId, searchQuery, showArchived, searchParams, loadNoteIntoEditor, setSearchParams])

  function handleSelectNote(note) {
    loadNoteIntoEditor(note)
    setSearchParams({ id: note.id })
  }

  // ─── Auto-Save Debouncer with Local Draft Protection ────────────
  const triggerAutoSave = useCallback(
    (updatedFields) => {
      if (!activeNoteId || !user?.id) return

      setSaveStatus('unsaved')

      // Debounced draft persistence to localStorage (300ms)
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current)
      }

      draftTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            `studyzone_draft_note_${activeNoteId}`,
            JSON.stringify({
              title: updatedFields.title ?? editorTitle,
              content: updatedFields.content ?? editorContent,
              summary: updatedFields.summary ?? editorSummary,
              subjectId: updatedFields.subjectId ?? editorSubjectId,
              tags: updatedFields.tags ?? editorTags,
              timestamp: Date.now(),
            }),
          )
        } catch {
          // ignore storage quota error
        }
      }, 300)

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(async () => {
        setSaveStatus('saving')
        const payload = {
          noteId: activeNoteId,
          userId: user.id,
          title: updatedFields.title ?? editorTitle,
          content: updatedFields.content ?? editorContent,
          summary: updatedFields.summary ?? editorSummary,
          subjectId: updatedFields.subjectId ?? editorSubjectId,
          tags: updatedFields.tags ?? editorTags,
          isPinned: updatedFields.isPinned ?? isEditorPinned,
        }

        try {
          const res = await updateNote(payload)
          if (res.error) {
            setSaveStatus('offline')
          } else {
            setSaveStatus('saved')
            setLastSavedTime(new Date())
            // Clear saved draft from localStorage
            try {
              localStorage.removeItem(`studyzone_draft_note_${activeNoteId}`)
            } catch {
              // ignore
            }
            // Optimistically update notes list
            setNotes((prev) =>
              prev.map((n) => (n.id === activeNoteId ? { ...n, ...res.data } : n)),
            )
          }
        } catch {
          setSaveStatus('offline')
        }
      }, 1000)
    },
    [
      activeNoteId,
      user,
      editorTitle,
      editorContent,
      editorSummary,
      editorSubjectId,
      editorTags,
      isEditorPinned,
    ],
  )

  // ─── Note CRUD Handlers ────────────────────────────────────────
  async function handleCreateNote(initialData = {}) {
    if (!user?.id) return
    setLoading(true)

    try {
      const res = await createNote({
        userId: user.id,
        title: initialData.title || 'Untitled Note',
        content: initialData.content || '',
        summary: initialData.summary || null,
        tags: initialData.tags || [],
        subjectId: initialData.subjectId || selectedSubjectId || null,
        isPinned: false,
      })

      if (res.data) {
        loadNoteIntoEditor(res.data)
        setSearchParams({ id: res.data.id })
      }
      await refreshData()
    } catch {
      setFetchError('Failed to create note.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSample() {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await createSampleNote(user.id, subjects[0]?.id || null)
      if (res.data) {
        loadNoteIntoEditor(res.data)
        setSearchParams({ id: res.data.id })
      }
      await refreshData()
    } catch {
      setFetchError('Failed to create sample note.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDeleteDialog() {
    if (!activeNoteId) return
    const note = notes.find((n) => n.id === activeNoteId)
    setNoteToDelete(note || { id: activeNoteId, title: editorTitle })
    setDeleteConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    if (!noteToDelete?.id || !user?.id) return
    setDeleteLoading(true)
    try {
      await deleteNote(noteToDelete.id, user.id)
      try {
        localStorage.removeItem(`studyzone_draft_note_${noteToDelete.id}`)
      } catch {
        // ignore
      }
      setActiveNoteId(null)
      setSearchParams({})
      await refreshData()
    } finally {
      setDeleteLoading(false)
      setDeleteConfirmOpen(false)
      setNoteToDelete(null)
    }
  }

  async function handleTogglePinActiveNote() {
    if (!activeNoteId || !user?.id) return
    const nextPinned = !isEditorPinned
    setIsEditorPinned(nextPinned)
    triggerAutoSave({ isPinned: nextPinned })
  }

  async function handleToggleArchiveActiveNote() {
    if (!activeNoteId || !user?.id) return
    const currentNote = notes.find((n) => n.id === activeNoteId)
    const nextArchived = !currentNote?.isArchived
    await archiveNote(activeNoteId, user.id, nextArchived)
    setActiveNoteId(null)
    setSearchParams({})
    refreshData()
  }

  // ─── Tag Management ────────────────────────────────────────────
  function handleAddTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const cleanTag = newTagInput.trim().replace(/^#/, '')
      if (cleanTag && !editorTags.includes(cleanTag)) {
        const nextTags = [...editorTags, cleanTag]
        setEditorTags(nextTags)
        setNewTagInput('')
        triggerAutoSave({ tags: nextTags })
      }
    }
  }

  function handleRemoveTag(tagToRemove) {
    const nextTags = editorTags.filter((t) => t !== tagToRemove)
    setEditorTags(nextTags)
    triggerAutoSave({ tags: nextTags })
  }

  // ─── Editor Markdown Toolbar ───────────────────────────────────
  function insertMarkdown(prefix, suffix = '') {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = editorContent
    const selected = text.substring(start, end)

    const replacement = `${prefix}${selected || 'text'}${suffix}`
    const nextContent = text.substring(0, start) + replacement + text.substring(end)

    setEditorContent(nextContent)
    triggerAutoSave({ content: nextContent })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4),
      )
    }, 0)
  }

  // ─── AI Assistance Actions ─────────────────────────────────────
  async function handleRunAiAction(actionType) {
    if (!editorContent.trim()) return
    setAiMenuOpen(false)
    setAiActionLoading(true)
    setAiProposalType(actionType)
    setAiProposalContent('')
    setIsAiModalOpen(true)
    setCopiedProposal(false)

    // Context limit check (~6,000 characters)
    const trimmedContent = editorContent.trim().slice(0, 6000)

    let prompt = ''
    if (actionType === 'summary') {
      prompt = `Summarize the following study note into 3-4 concise, high-impact bullet points focusing on key takeaways:\n\n${trimmedContent}`
    } else if (actionType === 'questions') {
      prompt = `Generate 3 active recall practice questions with clear, concise answers based strictly on this study note. Format each as:\nQ: [Question]\nA: [Answer]\n\nNote:\n${trimmedContent}`
    } else if (actionType === 'explain') {
      prompt = `Explain the core concepts in this study note simply and clearly using the Feynman technique with an intuitive real-world analogy:\n\n${trimmedContent}`
    } else if (actionType === 'structure') {
      prompt = `Improve the clarity and structure of this study note. Organize it with clean section headings (##), bold key terms, and bullet points while preserving all original factual details:\n\n${trimmedContent}`
    }

    try {
      const res = await sendMessage({ message: prompt, history: [] })
      setAiProposalContent(res.reply || 'No response generated.')
    } catch {
      setAiProposalContent('AI study partner temporarily unavailable. Please check your connection and try again.')
    } finally {
      setAiActionLoading(false)
    }
  }

  function handleApplyAiProposal() {
    if (aiProposalType === 'structure') {
      setEditorContent(aiProposalContent)
      triggerAutoSave({ content: aiProposalContent })
    } else if (aiProposalType === 'summary') {
      const updated = `> **Key Takeaways:**\n${aiProposalContent}\n\n---\n\n${editorContent}`
      setEditorContent(updated)
      triggerAutoSave({ content: updated })
    } else if (aiProposalType === 'questions' || aiProposalType === 'explain') {
      const appended = `${editorContent}\n\n---\n### ✨ ${aiProposalType === 'questions' ? 'Practice Questions' : 'Feynman Explanation'}\n\n${aiProposalContent}`
      setEditorContent(appended)
      triggerAutoSave({ content: appended })
    }
    setIsAiModalOpen(false)
    setAiProposalContent('')
  }

  async function handleCopyProposal() {
    if (!aiProposalContent) return
    try {
      await navigator.clipboard.writeText(aiProposalContent)
      setCopiedProposal(true)
      setTimeout(() => setCopiedProposal(false), 2000)
    } catch {
      // ignore
    }
  }

  // ─── Flashcards from Note Generator ────────────────────────────
  async function handleLaunchFlashcardGenerator() {
    if (!editorContent.trim()) return
    setAiMenuOpen(false)
    setAiActionLoading(true)
    setIsFlashcardModalOpen(true)
    setFlashcardSuccess(false)
    setFlashcardDeckTitle(editorTitle.trim() || 'Study Note Deck')

    const prompt = `Based on the following study note, generate 5 high-yield active recall flashcards.
Format your response as a strict JSON array of objects with "front" (concise question testing 1 atomic concept) and "back" (accurate, clear answer) fields. Do not include markdown code block syntax.

Note Content:
${editorContent.trim().slice(0, 6000)}`

    try {
      const res = await sendMessage({ message: prompt, history: [] })
      let clean = res.reply.replace(/```json/g, '').replace(/```/g, '').trim()
      const jsonStart = clean.indexOf('[')
      const jsonEnd = clean.lastIndexOf(']')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        clean = clean.slice(jsonStart, jsonEnd + 1)
      }
      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed)) {
        setProposedFlashcards(
          parsed.map((c) => ({
            front: c.front || '',
            back: c.back || '',
            selected: true,
          })),
        )
      }
    } catch (err) {
      console.warn('Flashcard generation failed:', err)
    } finally {
      setAiActionLoading(false)
    }
  }

  async function handleSaveFlashcardsToDeck() {
    if (!user?.id) return
    const approved = proposedFlashcards.filter(
      (c) => c.selected && c.front.trim() && c.back.trim(),
    )
    if (approved.length === 0) return

    setSavingCards(true)
    try {
      const deckRes = await createFlashcardDeck({
        userId: user.id,
        title: flashcardDeckTitle.trim() || 'Note Study Deck',
        subjectId: editorSubjectId || null,
        description: `Generated from study note: ${editorTitle.trim()}`,
      })

      if (deckRes.data?.id) {
        await createBulkFlashcards({
          deckId: deckRes.data.id,
          userId: user.id,
          cards: approved,
        })
        setFlashcardSuccess(true)
        setTimeout(() => {
          setIsFlashcardModalOpen(false)
          setProposedFlashcards([])
        }, 1200)
      }
    } finally {
      setSavingCards(false)
    }
  }

  // Filtered notes list (pinned on top, then by updated_at)
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    })
  }, [notes])

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null
  }, [notes, activeNoteId])

  // ───────────────────────────────────────────────────────────────
  // RENDER: Clean Single-Pane Writing Experience
  // ───────────────────────────────────────────────────────────────
  return (
    <PageContainer width="wide" className="space-y-4 pb-12">
      {/* Top Header (Adapts on mobile: recedes when editing a note) */}
      <div className={cn(activeNoteId ? 'hidden lg:block' : 'block')}>
        <PageHeader
          title="Study Notes"
          description="Capture knowledge, write markdown, and understand with AI study tools."
          icon={FileText}
          actions={
            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateNote()}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Note</span>
            </Button>
          }
        />
      </div>

      {fetchError && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={refreshData} className="h-6 text-xs text-danger">
            Retry
          </Button>
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
        {/* ─── Left Column: Notes Navigation List ─── */}
        <div
          className={cn(
            'lg:col-span-4 xl:col-span-3 space-y-3',
            activeNoteId ? 'hidden lg:block' : 'block',
          )}
        >
          {/* Search & Subject Filter Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value)
                  setSearchParams(e.target.value ? { subjectId: e.target.value } : {})
                }}
                className="flex-1 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowArchived((prev) => !prev)}
                className={cn(
                  'rounded-xl border px-2.5 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer',
                  showArchived
                    ? 'border-accent/40 bg-accent/15 text-accent'
                    : 'border-border bg-surface text-muted hover:text-foreground',
                )}
                title={showArchived ? 'Showing archived notes' : 'Show archived notes'}
              >
                <Archive className="h-3 w-3" />
                <span className="hidden sm:inline">{showArchived ? 'Archived' : 'Active'}</span>
              </button>
            </div>
          </div>

          {/* Notes List Cards */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : sortedNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted space-y-2">
                <FileText className="h-6 w-6 mx-auto text-muted/60" />
                <p className="text-xs font-semibold">No notes found</p>
                <p className="text-[11px]">Create a note to start capturing your knowledge.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateNote()}
                  className="mt-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> New Note
                </Button>
              </div>
            ) : (
              sortedNotes.map((n) => {
                const isSelected = n.id === activeNoteId
                const sub = subjectMap.get(n.subjectId)
                const excerpt = (n.content || '')
                  .replace(/[#*`_>]/g, '')
                  .slice(0, 80)
                  .trim()

                return (
                  <div
                    key={n.id}
                    onClick={() => handleSelectNote(n)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all cursor-pointer group',
                      isSelected
                        ? 'border-accent bg-accent/8 shadow-xs ring-1 ring-accent/30'
                        : 'border-border/80 bg-surface hover:border-border hover:bg-surface-raised/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {n.isPinned && <Pin className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />}
                        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-accent transition-colors">
                          {n.title || 'Untitled Note'}
                        </h4>
                      </div>
                      <span className="text-[10px] text-muted shrink-0">
                        {formatDate(n.updatedAt || n.createdAt)}
                      </span>
                    </div>

                    {excerpt && (
                      <p className="text-[11px] text-muted line-clamp-2 leading-relaxed mb-2">
                        {excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      {sub && (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${sub.color}15`,
                            color: sub.color,
                            border: `1px solid ${sub.color}30`,
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
                          <span className="truncate max-w-[110px]">{sub.name}</span>
                        </span>
                      )}
                      {n.isArchived && (
                        <span className="text-[9px] rounded-md bg-muted/20 text-muted px-1.5 py-0.5">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ─── Right Column: Note Writing Canvas ─── */}
        <div
          className={cn(
            'lg:col-span-8 xl:col-span-9',
            activeNoteId ? 'block' : 'hidden lg:block',
          )}
        >
          {activeNoteId ? (
            <div className="rounded-2xl border border-border/80 bg-surface shadow-xs p-4 sm:p-6 space-y-4 min-h-[600px] flex flex-col justify-between transition-colors">
              <div className="space-y-3.5">
                {/* Top Controls Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    {/* Mobile Back Button */}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveNoteId(null)
                        setSearchParams({})
                      }}
                      className="lg:hidden flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 cursor-pointer mr-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Notes</span>
                    </Button>

                    <button
                      type="button"
                      onClick={handleTogglePinActiveNote}
                      className={cn(
                        'p-1.5 rounded-lg border transition-colors cursor-pointer',
                        isEditorPinned
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                          : 'border-border text-muted hover:text-foreground',
                      )}
                      title={isEditorPinned ? 'Unpin Note' : 'Pin Note'}
                    >
                      {isEditorPinned ? <Pin className="h-3.5 w-3.5 fill-current" /> : <PinOff className="h-3.5 w-3.5" />}
                    </button>

                    {/* Auto-save & Offline Status */}
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      {saveStatus === 'saving' && (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin text-accent" />
                          <span>Saving...</span>
                        </>
                      )}
                      {saveStatus === 'saved' && (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>
                            Saved {lastSavedTime ? lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </>
                      )}
                      {saveStatus === 'unsaved' && <span className="text-warning">Unsaved changes</span>}
                      {saveStatus === 'offline' && (
                        <span className="text-emerald-500/90 font-medium">Offline — draft saved locally</span>
                      )}
                      {saveStatus === 'error' && (
                        <button
                          type="button"
                          onClick={() => triggerAutoSave({})}
                          className="text-danger hover:underline"
                        >
                          Sync failed — Retry
                        </button>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Mode Tabs: Edit vs Preview */}
                    <div className="flex items-center rounded-lg border border-border bg-surface-raised/60 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setEditorViewMode('edit')}
                        className={cn(
                          'px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer',
                          editorViewMode === 'edit' ? 'bg-accent text-white' : 'text-muted hover:text-foreground',
                        )}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorViewMode('preview')}
                        className={cn(
                          'px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer',
                          editorViewMode === 'preview' ? 'bg-accent text-white' : 'text-muted hover:text-foreground',
                        )}
                      >
                        Preview
                      </button>
                    </div>

                    {/* ✨ Study with AI Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAiMenuOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent/20 transition-all cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Study with AI</span>
                      </button>

                      {aiMenuOpen && (
                        <div className="absolute right-0 mt-1.5 z-40 w-52 rounded-xl border border-border bg-surface shadow-xl p-1.5 space-y-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => handleRunAiAction('summary')}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-raised text-foreground transition-colors text-left cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-accent" />
                            <span>Summarize Note</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunAiAction('explain')}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-raised text-foreground transition-colors text-left cursor-pointer"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Explain Simply</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunAiAction('questions')}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-raised text-foreground transition-colors text-left cursor-pointer"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-purple-500" />
                            <span>Quiz Me (3 Questions)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunAiAction('structure')}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-raised text-foreground transition-colors text-left cursor-pointer"
                          >
                            <Layers className="h-3.5 w-3.5 text-amber-500" />
                            <span>Improve My Notes</span>
                          </button>
                          <div className="border-t border-border/60 my-1" />
                          <button
                            type="button"
                            onClick={handleLaunchFlashcardGenerator}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-raised text-accent font-semibold transition-colors text-left cursor-pointer"
                          >
                            <Brain className="h-3.5 w-3.5" />
                            <span>Generate Flashcards</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAiMenuOpen(false)
                              navigate('/ai-assistant', {
                                state: {
                                  attachedContext: {
                                    type: 'note',
                                    id: activeNote?.id,
                                    title: editorTitle || activeNote?.title,
                                    content: editorContent,
                                  },
                                },
                              })
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-raised text-foreground transition-colors text-left cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                            <span>Ask AI Study Tutor</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleArchiveActiveNote}
                      className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
                      title={activeNote?.isArchived ? 'Unarchive Note' : 'Archive Note'}
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenDeleteDialog}
                      className="p-1.5 rounded-lg border border-border text-muted hover:text-danger transition-colors cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Title Input */}
                <div>
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => {
                      setEditorTitle(e.target.value)
                      triggerAutoSave({ title: e.target.value })
                    }}
                    placeholder="Note Title..."
                    className="w-full text-xl sm:text-2xl font-bold text-foreground bg-transparent border-0 focus:outline-hidden placeholder:text-muted/60"
                  />
                </div>

                {/* Subject Association & Tag Row */}
                <div className="flex flex-wrap items-center gap-2.5 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <BookOpen className="h-3.5 w-3.5 text-accent" />
                    <select
                      value={editorSubjectId}
                      onChange={(e) => {
                        setEditorSubjectId(e.target.value)
                        triggerAutoSave({ subjectId: e.target.value })
                      }}
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
                    >
                      <option value="">No Linked Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {editorTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-[11px] font-semibold text-accent"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-accent hover:text-danger"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="+ Tag (Enter)"
                      className="w-24 rounded-md border border-dashed border-border bg-transparent px-2 py-0.5 text-[11px] text-foreground focus:border-accent focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Non-destructive Draft Recovery Prompt */}
                {recoveredDraft && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Unsaved draft found from a previous session</p>
                        <p className="text-[11px] text-muted">
                          Your local draft differs from the saved note.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleRestoreDraft}
                        className="h-7 text-xs px-2.5 font-semibold cursor-pointer"
                      >
                        Restore Draft
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleDiscardDraft}
                        className="h-7 text-xs px-2.5 text-muted hover:text-foreground cursor-pointer"
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                )}

                {/* Single Formatting Toolbar (Shown in Edit Mode with 36x36px touch targets) */}
                {editorViewMode === 'edit' && (
                  <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-2 text-muted">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      title="Bold"
                      aria-label="Format Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*')}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      title="Italic"
                      aria-label="Format Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('## ')}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      title="Heading 1"
                      aria-label="Format Heading 1"
                    >
                      <Heading1 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('### ')}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      title="Heading 2"
                      aria-label="Format Heading 2"
                    >
                      <Heading2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- ')}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      title="Bullet List"
                      aria-label="Format Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('1. ')}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      title="Numbered List"
                      aria-label="Format Numbered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('```\n', '\n```')}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      title="Code Block"
                      aria-label="Format Code Block"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('> ')}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-transparent hover:border-border hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                      title="Quote"
                      aria-label="Format Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Single Primary Content Surface */}
                <div className="min-h-[420px]">
                  {editorViewMode === 'edit' ? (
                    <textarea
                      ref={textareaRef}
                      value={editorContent}
                      onChange={(e) => {
                        setEditorContent(e.target.value)
                        triggerAutoSave({ content: e.target.value })
                      }}
                      placeholder="Start writing what you learned today..."
                      className="w-full min-h-[440px] resize-y rounded-xl border border-border/70 bg-surface-raised/30 p-4 font-sans text-sm sm:text-base text-foreground focus:border-accent focus:outline-hidden leading-relaxed"
                    />
                  ) : (
                    <div className="w-full min-h-[440px] rounded-xl border border-border/70 bg-surface-raised/20 p-5 overflow-y-auto max-h-[600px]">
                      <MarkdownPreview content={editorContent || '*No content yet. Switch to Edit to write your notes.*'} />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom metadata footer */}
              <div className="flex items-center justify-between text-[11px] text-muted pt-3 border-t border-border/50">
                <span>{editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0} words</span>
                <span>
                  Last modified {activeNote?.updatedAt ? formatDate(activeNote.updatedAt) : 'Just now'}
                </span>
              </div>
            </div>
          ) : (
            /* Empty Canvas Placeholder */
            <div className="rounded-2xl border border-dashed border-border bg-surface-raised/30 p-12 text-center min-h-[580px] flex flex-col items-center justify-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Select a note to read or edit</h3>
              <p className="text-xs text-muted max-w-sm">
                Choose a note from the left list or create a new note to start capturing concepts and revision summaries.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCreateNote()}
                  className="text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Note
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCreateSample}
                  className="text-xs"
                >
                  Try Sample Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Non-Destructive AI Proposal Review Modal ─── */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold text-foreground">
                    {aiProposalType === 'summary' && 'AI Note Summary'}
                    {aiProposalType === 'explain' && 'Feynman Explanation'}
                    {aiProposalType === 'questions' && 'Active Recall Practice Questions'}
                    {aiProposalType === 'structure' && 'Proposed Note Improvement'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="rounded p-1 text-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {aiActionLoading ? (
                <div className="py-12 text-center space-y-3">
                  <LoadingSpinner size="md" />
                  <p className="text-xs text-muted">Generating AI study response...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-surface-raised/40 p-4 max-h-80 overflow-y-auto text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {aiProposalContent}
                  </div>

                  <p className="text-[11px] text-muted">
                    {aiProposalType === 'structure'
                      ? 'Clicking Apply will update your note structure. You can also copy the text.'
                      : 'You can insert this response into your note or copy it to your clipboard.'}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyProposal}
                      className="gap-1 text-xs"
                    >
                      {copiedProposal ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedProposal ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsAiModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyAiProposal}
                      className="text-xs font-bold"
                    >
                      {aiProposalType === 'structure' ? 'Apply Changes' : 'Insert into Note'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Flashcards Generation Review Modal ─── */}
      <AnimatePresence>
        {isFlashcardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold text-foreground">Generated Flashcards</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFlashcardModalOpen(false)}
                  className="rounded p-1 text-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {aiActionLoading ? (
                <div className="py-12 text-center space-y-3">
                  <LoadingSpinner size="md" />
                  <p className="text-xs text-muted">Extracting active recall cards from your note...</p>
                </div>
              ) : flashcardSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-foreground">Flashcard Deck Saved!</p>
                  <p className="text-xs text-muted">You can now practice them using SuperMemo SM-2 in Flashcards.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Deck Title</label>
                    <input
                      type="text"
                      value={flashcardDeckTitle}
                      onChange={(e) => setFlashcardDeckTitle(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {proposedFlashcards.map((card, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-border bg-surface-raised/40 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={card.selected}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setProposedFlashcards((prev) =>
                                  prev.map((c, i) => (i === idx ? { ...c, selected: checked } : c)),
                                )
                              }}
                              className="rounded border-border text-accent focus:ring-accent"
                            />
                            <span>Card #{idx + 1}</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={card.front}
                          onChange={(e) => {
                            const val = e.target.value
                            setProposedFlashcards((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, front: val } : c)),
                            )
                          }}
                          placeholder="Question (Front)"
                          className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-hidden"
                        />
                        <textarea
                          rows={2}
                          value={card.back}
                          onChange={(e) => {
                            const val = e.target.value
                            setProposedFlashcards((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, back: val } : c)),
                            )
                          }}
                          placeholder="Answer (Back)"
                          className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-accent focus:outline-hidden resize-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFlashcardModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={savingCards || proposedFlashcards.filter((c) => c.selected).length === 0}
                      onClick={handleSaveFlashcardsToDeck}
                      className="font-bold text-xs"
                    >
                      {savingCards ? 'Saving Deck...' : 'Add Selected Cards'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation Dialog ─── */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Study Note?"
        description={`Are you sure you want to delete "${noteToDelete?.title || 'this note'}"? This action cannot be undone.`}
        confirmText="Delete Note"
        variant="danger"
      />
    </PageContainer>
  )
}

/**
 * Lightweight safe Markdown renderer for study notes.
 */
function MarkdownPreview({ content }) {
  if (!content || !content.trim()) {
    return <p className="text-xs text-muted italic">No content to preview</p>
  }

  const lines = content.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeBuffer = []
  let keyIdx = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={keyIdx++}
            className="my-3 rounded-lg border border-border bg-black/40 p-3 font-mono text-xs text-emerald-400 overflow-x-auto"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>,
        )
        codeBuffer = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={keyIdx++} className="text-xl font-bold text-foreground mt-4 mb-2">
          {line.replace('# ', '')}
        </h1>,
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={keyIdx++} className="text-lg font-bold text-foreground mt-3 mb-1.5">
          {line.replace('## ', '')}
        </h2>,
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={keyIdx++} className="text-sm font-bold text-foreground mt-2 mb-1">
          {line.replace('### ', '')}
        </h3>,
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={keyIdx++} className="ml-4 list-disc text-xs text-foreground leading-relaxed">
          {line.replace(/^[-*]\s+/, '')}
        </li>,
      )
    } else if (/^\d+\.\s+/.test(line)) {
      elements.push(
        <li key={keyIdx++} className="ml-4 list-decimal text-xs text-foreground leading-relaxed">
          {line.replace(/^\d+\.\s+/, '')}
        </li>,
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={keyIdx++}
          className="border-l-2 border-accent pl-3 py-1 my-2 text-xs italic text-muted bg-accent/5 rounded-r"
        >
          {line.replace('> ', '')}
        </blockquote>,
      )
    } else if (line.trim() === '---') {
      elements.push(<hr key={keyIdx++} className="border-border my-4" />)
    } else if (line.trim()) {
      elements.push(
        <p key={keyIdx++} className="text-xs text-foreground leading-relaxed my-1">
          {line}
        </p>,
      )
    }
  }

  return <div className="space-y-1">{elements}</div>
}
