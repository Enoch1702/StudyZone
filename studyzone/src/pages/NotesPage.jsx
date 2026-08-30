import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  Clock,
  Code,
  FileText,
  Heading1,
  Heading2,
  HelpCircle,
  Italic,
  Layers,
  List,
  ListOrdered,
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
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
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
  const [selectedTag, setSelectedTag] = useState('')
  const [sortBy, setSortBy] = useState('updated_desc')
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
  const [editorViewMode, setEditorViewMode] = useState('split') // 'edit', 'preview', 'split'

  // ─── Save State Tracking ───────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState('saved') // 'saving', 'saved', 'unsaved', 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null)
  const autoSaveTimerRef = useRef(null)
  const textareaRef = useRef(null)

  // ─── AI Modal & Proposal States ────────────────────────────────
  const [aiActionLoading, setAiActionLoading] = useState(false)
  const [aiProposalType, setAiProposalType] = useState(null) // 'summary', 'questions', 'explain', 'structure'
  const [aiProposalContent, setAiProposalContent] = useState('')
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  // Flashcards proposal state
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)
  const [proposedFlashcards, setProposedFlashcards] = useState([])
  const [flashcardDeckTitle, setFlashcardDeckTitle] = useState('')
  const [savingCards, setSavingCards] = useState(false)
  const [flashcardSuccess, setFlashcardSuccess] = useState(false)

  // ─── Subject Map ───────────────────────────────────────────────
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  // ─── All Distinct Tags in User Notes ───────────────────────────
  const allTags = useMemo(() => {
    const tagSet = new Set()
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => tagSet.add(t))
      }
    })
    return Array.from(tagSet).sort()
  }, [notes])

  // Helper to load note details into editor
  const loadNoteIntoEditor = useCallback((note) => {
    if (!note) return
    setActiveNoteId(note.id)
    setEditorTitle(note.title || '')
    setEditorContent(note.content || '')
    setEditorSummary(note.summary || '')
    setEditorSubjectId(note.subjectId || '')
    setEditorTags(Array.isArray(note.tags) ? note.tags : [])
    setIsEditorPinned(Boolean(note.isPinned))
    setSaveStatus('saved')
    setLastSavedTime(new Date(note.updatedAt || note.createdAt))
  }, [])

  // ─── Fetch Data ────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [notesRes, subRes] = await Promise.all([
        getNotes(user.id, {
          subjectId: selectedSubjectId || null,
          tag: selectedTag || null,
          searchQuery: searchQuery || '',
          sortBy,
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
      setFetchError('Unable to load notes.')
    } finally {
      setLoading(false)
    }
  }, [user, selectedSubjectId, selectedTag, searchQuery, sortBy, showArchived])

  // Load initial data and sync URL param
  useEffect(() => {
    let ignore = false

    async function initialLoad() {
      if (!user?.id) return
      try {
        const [notesRes, subRes] = await Promise.all([
          getNotes(user.id, {
            subjectId: selectedSubjectId || null,
            tag: selectedTag || null,
            searchQuery: searchQuery || '',
            sortBy,
            includeArchived: showArchived,
          }),
          getSubjects(user.id),
        ])

        if (!ignore) {
          const loadedNotes = notesRes.data || []
          setNotes(loadedNotes)
          if (subRes.data) setSubjects(subRes.data)
          setFetchError('')

          // If URL has note ID, select it
          const urlNoteId = searchParams.get('id')
          if (urlNoteId) {
            const found = loadedNotes.find((n) => n.id === urlNoteId)
            if (found) {
              loadNoteIntoEditor(found)
            }
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
  }, [user, selectedSubjectId, selectedTag, searchQuery, sortBy, showArchived, searchParams, loadNoteIntoEditor])

  function handleSelectNote(note) {
    loadNoteIntoEditor(note)
    setSearchParams({ id: note.id })
  }

  // ─── Auto-Save Debouncer ───────────────────────────────────────
  const triggerAutoSave = useCallback(
    (updatedFields) => {
      if (!activeNoteId || !user?.id) return

      setSaveStatus('unsaved')
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

        const res = await updateNote(payload)
        if (res.error) {
          setSaveStatus('error')
        } else {
          setSaveStatus('saved')
          setLastSavedTime(new Date())
          // Optimistically update notes list
          setNotes((prev) =>
            prev.map((n) => (n.id === activeNoteId ? { ...n, ...res.data } : n)),
          )
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

    const res = await createNote({
      userId: user.id,
      title: initialData.title || 'Untitled Note',
      content: initialData.content || '',
      summary: initialData.summary || null,
      tags: initialData.tags || (selectedTag ? [selectedTag] : []),
      subjectId: initialData.subjectId || selectedSubjectId || null,
      isPinned: false,
    })

    if (res.data) {
      loadNoteIntoEditor(res.data)
      setSearchParams({ id: res.data.id })
    }
    await refreshData()
    setLoading(false)
  }

  async function handleCreateSample() {
    if (!user?.id) return
    setLoading(true)
    const res = await createSampleNote(user.id, subjects[0]?.id || null)
    if (res.data) {
      loadNoteIntoEditor(res.data)
      setSearchParams({ id: res.data.id })
    }
    await refreshData()
    setLoading(false)
  }

  async function handleDeleteActiveNote() {
    if (!activeNoteId || !user?.id) return
    const noteToDelete = notes.find((n) => n.id === activeNoteId)
    const confirm = window.confirm(
      `Are you sure you want to delete "${noteToDelete?.title || 'this note'}"?`,
    )
    if (!confirm) return

    await deleteNote(activeNoteId, user.id)
    setActiveNoteId(null)
    setSearchParams({})
    refreshData()
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

    // Restore focus and selection
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
    setAiActionLoading(true)
    setAiProposalType(actionType)
    setIsAiModalOpen(true)

    let prompt = ''
    if (actionType === 'summary') {
      prompt = `You are a learning science tutor. Summarize the following study note into 3-4 bullet points emphasizing key takeaways and cognitive models:\n\n${editorContent.trim()}`
    } else if (actionType === 'questions') {
      prompt = `Generate 4 active recall practice questions with clear, accurate answers based strictly on this study note. Format each as:\nQ: [Question]\nA: [Answer]\n\nNote:\n${editorContent.trim()}`
    } else if (actionType === 'explain') {
      prompt = `Explain the core concepts in this study note in simple, intuitive terms using the Feynman technique and clear analogies:\n\n${editorContent.trim()}`
    } else if (actionType === 'structure') {
      prompt = `Improve the structure of this study note. Organize it into clean sections, markdown headings (##), bold key terms, and bulleted takeaways without omitting any vital factual information:\n\n${editorContent.trim()}`
    }

    try {
      const res = await sendMessage({ message: prompt, history: [] })
      setAiProposalContent(res.reply || 'No output generated.')
    } catch {
      setAiProposalContent('AI assistance temporarily unavailable. Please try again.')
    } finally {
      setAiActionLoading(false)
    }
  }

  function handleApplyAiProposal() {
    if (aiProposalType === 'summary') {
      setEditorSummary(aiProposalContent)
      triggerAutoSave({ summary: aiProposalContent })
    } else if (aiProposalType === 'structure') {
      setEditorContent(aiProposalContent)
      triggerAutoSave({ content: aiProposalContent })
    } else if (aiProposalType === 'questions' || aiProposalType === 'explain') {
      const appended = `${editorContent}\n\n---\n### 🤖 AI Study Notes (${aiProposalType === 'questions' ? 'Practice Questions' : 'Feynman Explanation'})\n\n${aiProposalContent}`
      setEditorContent(appended)
      triggerAutoSave({ content: appended })
    }
    setIsAiModalOpen(false)
    setAiProposalContent('')
  }

  // ─── Flashcards from Note Generator ────────────────────────────
  async function handleLaunchFlashcardGenerator() {
    if (!editorContent.trim()) return
    setAiActionLoading(true)
    setIsFlashcardModalOpen(true)
    setFlashcardSuccess(false)
    setFlashcardDeckTitle(editorTitle.trim() || 'Study Note Deck')

    const prompt = `Based on the following study note, generate 5 high-yield active recall flashcards.
Format your response as a strict JSON array of objects with "front" (question/prompt) and "back" (answer/explanation) fields. Do not include markdown block ticks.

Note Content:
${editorContent.trim()}`

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
      }, 1500)
    }
    setSavingCards(false)
  }

  // ─── Overview Stats ────────────────────────────────────────────
  const overviewStats = useMemo(() => {
    const total = notes.length
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const updatedThisWeek = notes.filter((n) => new Date(n.updatedAt) >= oneWeekAgo).length
    const pinned = notes.filter((n) => n.isPinned).length
    const linkedSubIds = new Set(notes.map((n) => n.subjectId).filter(Boolean))

    return {
      total,
      updatedThisWeek,
      pinned,
      linkedSubjectsCount: linkedSubIds.size,
    }
  }, [notes])

  // ───────────────────────────────────────────────────────────────
  // RENDER: Main View
  // ───────────────────────────────────────────────────────────────
  return (
    <PageContainer width="wide" className="space-y-6 pb-12">
      {/* ─── Header & Primary Actions ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Study Notes
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Capture ideas, organize knowledge, and prepare for revision.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeNoteId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveNoteId(null)
                setSearchParams({})
              }}
              className="gap-1.5 text-xs text-muted hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Notes</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => handleCreateNote()}
            className="gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* ─── Fetch Error Alert ───────────────────────────────────── */}
      {fetchError && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* ─── Overview Stats Strip ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-3.5 bg-surface border-border/80 shadow-xs">
          <div className="flex items-center gap-2 text-muted mb-1">
            <FileText className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Notes</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-foreground">{overviewStats.total}</p>
        </Card>

        <Card className="p-3.5 bg-surface border-border/80 shadow-xs">
          <div className="flex items-center gap-2 text-muted mb-1">
            <Clock className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">This Week</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-foreground">
            {overviewStats.updatedThisWeek} updated
          </p>
        </Card>

        <Card className="p-3.5 bg-surface border-border/80 shadow-xs">
          <div className="flex items-center gap-2 text-muted mb-1">
            <Pin className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Pinned</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-foreground">{overviewStats.pinned}</p>
        </Card>

        <Card className="p-3.5 bg-surface border-border/80 shadow-xs">
          <div className="flex items-center gap-2 text-muted mb-1">
            <BookOpen className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Subjects</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-foreground">
            {overviewStats.linkedSubjectsCount} linked
          </p>
        </Card>
      </div>

      {/* ─── Search, Filters & Controls Bar ──────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-surface-raised/40 p-3 rounded-2xl border border-border/80">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title, content, or tags..."
              className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value)
              if (e.target.value) {
                setSearchParams({ subjectId: e.target.value })
              } else {
                setSearchParams({})
              }
            }}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
            >
              <option value="">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
          >
            <option value="updated_desc">Recently Updated</option>
            <option value="created_desc">Recently Created</option>
            <option value="title_asc">Alphabetical (A-Z)</option>
          </select>

          {/* Archive Toggle */}
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
              showArchived
                ? 'border-accent/40 bg-accent/15 text-accent'
                : 'border-border bg-surface text-muted hover:text-foreground',
            )}
          >
            <Archive className="h-3 w-3" />
            <span>{showArchived ? 'Archived Notes' : 'Active'}</span>
          </button>
        </div>
      </div>

      {/* ─── Main Content Split or Grid ──────────────────────────── */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : activeNoteId ? (
        /* ═══════════════════════════════════════════════════════════════
           ACTIVE NOTE EDITOR VIEW
           ═══════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Note Editor Column */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="border-border/90 bg-surface shadow-md p-6 space-y-4">
              {/* Top Controls Strip: Save Status & Actions */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
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

                  {/* Auto-save Status Indicator */}
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
                    {saveStatus === 'error' && <span className="text-danger">Save error</span>}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border border-border bg-surface-raised/60 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('edit')}
                      className={cn(
                        'px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                        editorViewMode === 'edit' ? 'bg-accent text-white' : 'text-muted hover:text-foreground',
                      )}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('split')}
                      className={cn(
                        'px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer hidden md:block',
                        editorViewMode === 'split' ? 'bg-accent text-white' : 'text-muted hover:text-foreground',
                      )}
                    >
                      Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorViewMode('preview')}
                      className={cn(
                        'px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                        editorViewMode === 'preview' ? 'bg-accent text-white' : 'text-muted hover:text-foreground',
                      )}
                    >
                      Preview
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleArchiveActiveNote}
                    className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
                    title="Archive Note"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteActiveNote}
                    className="p-1.5 rounded-lg border border-border text-muted hover:text-danger transition-colors cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
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

              {/* Subject & Tags Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-b border-border/40 pb-3">
                {/* Linked Subject */}
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <BookOpen className="h-3.5 w-3.5 text-accent" />
                  <select
                    value={editorSubjectId}
                    onChange={(e) => {
                      setEditorSubjectId(e.target.value)
                      triggerAutoSave({ subjectId: e.target.value })
                    }}
                    className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
                  >
                    <option value="">No Linked Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
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
                    placeholder="+ Tag (press Enter)"
                    className="w-28 rounded-md border border-dashed border-border bg-transparent px-2 py-0.5 text-[11px] text-foreground focus:border-accent focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Markdown Toolbar */}
              {editorViewMode !== 'preview' && (
                <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-2 text-muted">
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**')}
                    className="p-1.5 rounded hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    title="Bold (**text**)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*')}
                    className="p-1.5 rounded hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    title="Italic (*text*)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('# ')}
                    className="p-1.5 rounded hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    title="Heading 1"
                  >
                    <Heading1 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('## ')}
                    className="p-1.5 rounded hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    title="Heading 2"
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('- ')}
                    className="p-1.5 rounded hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('1. ')}
                    className="p-1.5 rounded hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('```\n', '\n```')}
                    className="p-1.5 rounded hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    title="Code Block"
                  >
                    <Code className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('> ')}
                    className="p-1.5 rounded hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                    title="Blockquote"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Editor / Preview Area */}
              <div
                className={cn(
                  'min-h-[360px] grid gap-4',
                  editorViewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1',
                )}
              >
                {/* Textarea Input */}
                {(editorViewMode === 'edit' || editorViewMode === 'split') && (
                  <textarea
                    ref={textareaRef}
                    value={editorContent}
                    onChange={(e) => {
                      setEditorContent(e.target.value)
                      triggerAutoSave({ content: e.target.value })
                    }}
                    placeholder="Write your study notes using Markdown formatting..."
                    className="w-full min-h-[360px] resize-y rounded-xl border border-border bg-surface-raised/40 p-4 font-mono text-xs text-foreground focus:border-accent focus:outline-hidden leading-relaxed"
                  />
                )}

                {/* Rendered Preview */}
                {(editorViewMode === 'preview' || editorViewMode === 'split') && (
                  <div className="w-full min-h-[360px] rounded-xl border border-border bg-surface-raised/20 p-4 overflow-y-auto max-h-[500px]">
                    <MarkdownPreview content={editorContent} />
                  </div>
                )}
              </div>
            </Card>

            {/* Note Summary Card */}
            <Card className="border-border/90 bg-surface shadow-xs p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Note Summary & Takeaways
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRunAiAction('summary')}
                  className="text-xs text-accent hover:bg-accent/10 h-7"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Summary
                </Button>
              </div>
              <textarea
                rows={2}
                value={editorSummary}
                onChange={(e) => {
                  setEditorSummary(e.target.value)
                  triggerAutoSave({ summary: e.target.value })
                }}
                placeholder="Brief summary of key concepts for quick revision..."
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden resize-none"
              />
            </Card>
          </div>

          {/* AI Tools & Learning Workflow Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* AI Study Actions Panel */}
            <Card className="border-border/90 bg-surface shadow-md p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border/60 pb-2.5">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>AI Study Partner</span>
              </div>

              <div className="space-y-2">
                {/* Generate Flashcards */}
                <button
                  type="button"
                  onClick={handleLaunchFlashcardGenerator}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-accent/30 bg-accent/10 hover:bg-accent/15 transition-all text-left group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-accent text-white shadow-xs group-hover:scale-105 transition-transform">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Generate Flashcards</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Extract active recall cards for SuperMemo SM-2 review.
                    </p>
                  </div>
                </button>

                {/* Create Study Questions */}
                <button
                  type="button"
                  onClick={() => handleRunAiAction('questions')}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-raised/40 hover:bg-surface-raised transition-all text-left group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Self-Test Questions</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Generate practice recall questions from this note.
                    </p>
                  </div>
                </button>

                {/* Explain Simply (Feynman) */}
                <button
                  type="button"
                  onClick={() => handleRunAiAction('explain')}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-raised/40 hover:bg-surface-raised transition-all text-left group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Explain Simply</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Feynman technique simplified explanation.
                    </p>
                  </div>
                </button>

                {/* Improve Structure */}
                <button
                  type="button"
                  onClick={() => handleRunAiAction('structure')}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-raised/40 hover:bg-surface-raised transition-all text-left group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 group-hover:scale-105 transition-transform">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Improve Structure</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Organize note into clean outline and headings.
                    </p>
                  </div>
                </button>
              </div>
            </Card>

            {/* Note Meta Details */}
            <Card className="border-border/90 bg-surface shadow-xs p-4 space-y-2.5 text-xs">
              <span className="font-bold text-foreground">Note Metadata</span>
              <div className="space-y-1.5 text-muted">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-mono text-foreground">
                    {formatDate(notes.find((n) => n.id === activeNoteId)?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified:</span>
                  <span className="font-mono text-foreground">
                    {formatDate(notes.find((n) => n.id === activeNoteId)?.updatedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Word Count:</span>
                  <span className="font-mono text-foreground">
                    {editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0} words
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : notes.length === 0 ? (
        /* ═══════════════════════════════════════════════════════════════
           EMPTY STATE VIEW
           ═══════════════════════════════════════════════════════════════ */
        <Card className="border-border/90 bg-surface p-12 text-center space-y-4 shadow-md">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground sm:text-lg">No Study Notes Yet</h3>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
            Create your first study note to organize knowledge, summarize lectures, or prepare flashcards for active recall revision.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCreateSample}
              className="gap-1.5 cursor-pointer font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Try Sample Note</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateNote()}
              className="gap-1.5 font-bold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Note</span>
            </Button>
          </div>
        </Card>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           NOTES GRID VIEW
           ═══════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => {
            const sub = subjectMap.get(note.subjectId)
            const excerpt = (note.summary || note.content || '')
              .replace(/[#*`_>]/g, '')
              .slice(0, 140)
              .trim()

            return (
              <Card
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={cn(
                  'border-border/90 bg-surface hover:border-accent/50 transition-all duration-200 shadow-md flex flex-col justify-between cursor-pointer group',
                  note.isPinned && 'ring-1 ring-amber-500/30 border-amber-500/40',
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {sub && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent mb-1.5">
                          <BookOpen className="h-3 w-3" />
                          <span className="truncate">{sub.name}</span>
                        </span>
                      )}
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {note.title}
                      </CardTitle>
                    </div>

                    {note.isPinned && (
                      <span className="text-amber-500 shrink-0" title="Pinned Note">
                        <Pin className="h-3.5 w-3.5 fill-current" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted leading-relaxed line-clamp-3 mt-1.5">
                    {excerpt || <span className="italic">Empty note</span>}
                  </p>
                </CardHeader>

                <div className="p-4 pt-0 border-t border-border/60 mt-auto flex items-center justify-between">
                  {/* Tag preview */}
                  <div className="flex items-center gap-1 overflow-hidden max-w-[60%]">
                    {note.tags && note.tags.length > 0 ? (
                      note.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium text-muted truncate"
                        >
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDate(note.updatedAt)}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-accent group-hover:underline">
                    Edit &rarr;
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── AI Assistance Proposal Modal (ZERO AUTONOMOUS WRITES) ─── */}
      <AnimatePresence>
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold text-foreground">
                    AI Study Partner Proposal
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="rounded-lg p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {aiActionLoading ? (
                <div className="py-12 text-center space-y-3">
                  <LoadingSpinner size="md" />
                  <p className="text-xs text-muted">Analyzing note concepts with AI...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-surface-raised p-4 max-h-[300px] overflow-y-auto">
                    <MarkdownPreview content={aiProposalContent} />
                  </div>

                  <p className="text-[11px] text-muted">
                    Review the proposal above. Click <strong>Apply to Note</strong> to update your note or <strong>Dismiss</strong> to keep it unchanged.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAiModalOpen(false)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyAiProposal}
                      className="font-bold"
                    >
                      Apply to Note
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Flashcards from Note Generator Modal ─────────────────── */}
      <AnimatePresence>
        {isFlashcardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold text-foreground">
                    Create Flashcards From Note
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFlashcardModalOpen(false)}
                  className="rounded-lg p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {aiActionLoading ? (
                <div className="py-12 text-center space-y-3">
                  <LoadingSpinner size="md" />
                  <p className="text-xs text-muted">Extracting active recall flashcards...</p>
                </div>
              ) : flashcardSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">Deck Created Successfully!</h4>
                  <p className="text-xs text-muted">
                    Your cards are ready for spaced repetition in the Flashcards tool.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">
                      Deck Title
                    </label>
                    <input
                      type="text"
                      value={flashcardDeckTitle}
                      onChange={(e) => setFlashcardDeckTitle(e.target.value)}
                      placeholder="e.g. Operating Systems Chapter 4"
                      className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted block">
                      Proposed Cards ({proposedFlashcards.filter((c) => c.selected).length} selected)
                    </span>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto">
                      {proposedFlashcards.map((card, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-border bg-surface-raised/40 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                              <input
                                type="checkbox"
                                checked={card.selected}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  setProposedFlashcards((prev) =>
                                    prev.map((c, i) =>
                                      i === idx ? { ...c, selected: checked } : c,
                                    ),
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
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
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
                      disabled={
                        savingCards ||
                        proposedFlashcards.filter((c) => c.selected).length === 0
                      }
                      onClick={handleSaveFlashcardsToDeck}
                      className="font-bold"
                    >
                      {savingCards ? 'Saving Deck...' : 'Approve & Save Deck'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={keyIdx++} className="text-lg font-bold text-foreground mt-4 mb-2">
          {renderFormattedText(line.replace('# ', ''))}
        </h1>,
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={keyIdx++} className="text-base font-bold text-foreground mt-3 mb-1.5">
          {renderFormattedText(line.replace('## ', ''))}
        </h2>,
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={keyIdx++} className="text-sm font-semibold text-foreground mt-2 mb-1">
          {renderFormattedText(line.replace('### ', ''))}
        </h3>,
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={keyIdx++}
          className="my-2 border-l-2 border-accent pl-3 italic text-xs text-muted leading-relaxed"
        >
          {renderFormattedText(line.replace('> ', ''))}
        </blockquote>,
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={keyIdx++} className="ml-4 list-disc text-xs text-foreground leading-relaxed my-0.5">
          {renderFormattedText(line.replace(/^[-*]\s+/, ''))}
        </li>,
      )
    } else if (/^\d+\.\s+/.test(line)) {
      elements.push(
        <li key={keyIdx++} className="ml-4 list-decimal text-xs text-foreground leading-relaxed my-0.5">
          {renderFormattedText(line.replace(/^\d+\.\s+/, ''))}
        </li>,
      )
    } else if (line.trim() === '---') {
      elements.push(<hr key={keyIdx++} className="my-3 border-border" />)
    } else if (line.trim().length > 0) {
      elements.push(
        <p key={keyIdx++} className="text-xs text-foreground leading-relaxed my-1.5">
          {renderFormattedText(line)}
        </p>,
      )
    }
  }

  return <div className="space-y-1">{elements}</div>
}

function renderFormattedText(text) {
  // Simple inline parser for **bold** and *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-foreground">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-surface-raised px-1 py-0.5 font-mono text-[11px] text-accent">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
