import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Layers,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/useAuth'
import { getSubjects } from '../services/subjectsService'
import {
  getFlashcardDecks,
  createFlashcardDeck,
  deleteFlashcardDeck,
  getFlashcards,
  createFlashcard,
  createBulkFlashcards,
  submitCardReview,
  createSampleDeck,
} from '../services/flashcardsService'
import { sendMessage } from '../services/aiService'

export default function FlashcardsPage() {
  const { user } = useAuth()

  // ─── Data State ────────────────────────────────────────────────
  const [decks, setDecks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  // ─── Study / Practice Session State ────────────────────────────
  const [activeDeck, setActiveDeck] = useState(null)
  const [studyCards, setStudyCards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  // ─── Modals State ──────────────────────────────────────────────
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [newDeckSubjectId, setNewDeckSubjectId] = useState('')
  const [newDeckDesc, setNewDeckDesc] = useState('')

  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [targetDeckForCard, setTargetDeckForCard] = useState(null)
  const [newCardFront, setNewCardFront] = useState('')
  const [newCardBack, setNewCardBack] = useState('')

  // ─── AI Deck Generator State ───────────────────────────────────
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiSubjectId, setAiSubjectId] = useState('')
  const [aiCardCount, setAiCardCount] = useState(6)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiProposals, setAiProposals] = useState(null) // Array of { front, back, selected }

  const refreshData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [decksRes, subRes] = await Promise.all([
        getFlashcardDecks(user.id),
        getSubjects(user.id),
      ])
      if (decksRes.data) setDecks(decksRes.data)
      if (subRes.data) setSubjects(subRes.data)
    } catch (err) {
      console.warn('Error reloading flashcard decks:', err)
    }
  }, [user])

  useEffect(() => {
    let isMounted = true

    async function initLoad() {
      if (!user?.id) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        const [decksRes, subRes] = await Promise.all([
          getFlashcardDecks(user.id),
          getSubjects(user.id),
        ])

        if (isMounted) {
          if (decksRes.data) setDecks(decksRes.data)
          if (subRes.data) setSubjects(subRes.data)
        }
      } catch (err) {
        console.warn('Error loading flashcard decks:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initLoad()

    return () => {
      isMounted = false
    }
  }, [user])

  const subjectMap = useMemo(() => {
    const map = new Map()
    for (const s of subjects) map.set(s.id, s.name)
    return map
  }, [subjects])

  // ─── Launch Study Session ──────────────────────────────────────
  async function handleStartStudy(deck) {
    if (!user?.id || !deck) return
    setLoading(true)
    const cardsRes = await getFlashcards(deck.id, user.id)
    const cards = cardsRes.data || []

    if (cards.length === 0) {
      setTargetDeckForCard(deck)
      setIsAddCardOpen(true)
      setLoading(false)
      return
    }

    // Sort by due date (due first)
    const nowISO = new Date().toISOString()
    const sorted = [...cards].sort((a, b) => {
      const aDue = !a.next_review_at || a.next_review_at <= nowISO
      const bDue = !b.next_review_at || b.next_review_at <= nowISO
      if (aDue && !bDue) return -1
      if (!aDue && bDue) return 1
      return 0
    })

    setActiveDeck(deck)
    setStudyCards(sorted)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setReviewedCount(0)
    setIsSessionComplete(false)
    setLoading(false)
  }

  // ─── Review Card (SM-2 Rating) ─────────────────────────────────
  const handleRateCard = useCallback(
    async (quality) => {
      if (!studyCards.length || currentCardIndex >= studyCards.length || !user?.id) return

      const currentCard = studyCards[currentCardIndex]
      await submitCardReview({
        cardId: currentCard.id,
        userId: user.id,
        quality,
        currentCard,
      })

      setReviewedCount((prev) => prev + 1)

      if (currentCardIndex + 1 < studyCards.length) {
        setCurrentCardIndex((prev) => prev + 1)
        setIsFlipped(false)
      } else {
        setIsSessionComplete(true)
      }
    },
    [studyCards, currentCardIndex, user],
  )

  // ─── Keyboard Shortcuts in Study Mode ──────────────────────────
  useEffect(() => {
    if (!activeDeck || isSessionComplete) return

    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === 'Escape') {
        e.preventDefault()
        setActiveDeck(null)
        return
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard(1) // Again
        else if (e.key === '2') handleRateCard(3) // Hard
        else if (e.key === '3') handleRateCard(4) // Good
        else if (e.key === '4') handleRateCard(5) // Easy
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDeck, isFlipped, isSessionComplete, handleRateCard])

  // ─── Create Deck ───────────────────────────────────────────────
  async function handleCreateDeckSubmit(e) {
    e.preventDefault()
    if (!newDeckTitle.trim() || !user?.id) return

    await createFlashcardDeck({
      userId: user.id,
      title: newDeckTitle.trim(),
      subjectId: newDeckSubjectId || null,
      description: newDeckDesc.trim() || null,
    })

    setIsCreateDeckOpen(false)
    setNewDeckTitle('')
    setNewDeckSubjectId('')
    setNewDeckDesc('')
    refreshData()
  }

  // ─── Create Starter / Sample Deck ──────────────────────────────
  async function handleCreateSampleDeck() {
    if (!user?.id) return
    setLoading(true)
    await createSampleDeck(user.id, subjects[0]?.id || null)
    await refreshData()
    setLoading(false)
  }

  // ─── Create Manual Card ────────────────────────────────────────
  async function handleAddCardSubmit(e) {
    e.preventDefault()
    if (!newCardFront.trim() || !newCardBack.trim() || !targetDeckForCard || !user?.id) return

    await createFlashcard({
      deckId: targetDeckForCard.id,
      userId: user.id,
      front: newCardFront.trim(),
      back: newCardBack.trim(),
    })

    setNewCardFront('')
    setNewCardBack('')
    setIsAddCardOpen(false)
    refreshData()
  }

  // ─── AI Deck Generator Prompt ──────────────────────────────────
  async function handleGenerateWithAI() {
    if (!aiTopic.trim()) return
    setAiLoading(true)

    try {
      const prompt = `Generate exactly ${aiCardCount} study flashcards for the topic: "${aiTopic.trim()}".
Format your response as a strict JSON array of objects with "front" (concise question/prompt) and "back" (clear, accurate answer) fields. Do not include markdown code block syntax.`

      const response = await sendMessage({
        message: prompt,
        history: [],
      })

      // Parse JSON
      let cleanText = response.reply.replace(/```json/g, '').replace(/```/g, '').trim()
      const jsonStart = cleanText.indexOf('[')
      const jsonEnd = cleanText.lastIndexOf(']')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.slice(jsonStart, jsonEnd + 1)
      }

      const parsedCards = JSON.parse(cleanText)
      if (Array.isArray(parsedCards)) {
        setAiProposals(
          parsedCards.map((c) => ({
            front: c.front || '',
            back: c.back || '',
            selected: true,
          })),
        )
      }
    } catch (err) {
      console.warn('AI Flashcard generation failed:', err)
    } finally {
      setAiLoading(false)
    }
  }

  // ─── Approve & Save AI Cards ───────────────────────────────────
  async function handleApproveAICards() {
    if (!aiProposals || !user?.id) return
    const approvedCards = aiProposals.filter((c) => c.selected && c.front.trim() && c.back.trim())
    if (approvedCards.length === 0) return

    setAiLoading(true)

    // 1. Create new deck for AI cards
    const deckRes = await createFlashcardDeck({
      userId: user.id,
      title: aiTopic.slice(0, 50).trim(),
      subjectId: aiSubjectId || null,
      description: `AI-generated flashcard deck for ${aiTopic.trim()}`,
    })

    const newDeck = deckRes.data
    if (newDeck?.id) {
      // 2. Bulk insert cards
      await createBulkFlashcards({
        deckId: newDeck.id,
        userId: user.id,
        cards: approvedCards,
      })
    }

    setAiLoading(false)
    setIsAiModalOpen(false)
    setAiProposals(null)
    setAiTopic('')
    setAiSubjectId('')
    refreshData()
  }

  // ─── Delete Deck ───────────────────────────────────────────────
  async function handleDeleteDeck(deckId) {
    if (!user?.id) return
    await deleteFlashcardDeck(deckId, user.id)
    refreshData()
  }

  // ───────────────────────────────────────────────────────────────
  // RENDER: Active Study / Practice Mode
  // ───────────────────────────────────────────────────────────────
  if (activeDeck) {
    const currentCard = studyCards[currentCardIndex]
    const progressPercent = studyCards.length > 0 ? (reviewedCount / studyCards.length) * 100 : 0

    return (
      <PageContainer width="medium" className="py-6 space-y-6 max-w-3xl">
        {/* Study Mode Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveDeck(null)
                refreshData()
              }}
              className="text-xs text-muted hover:text-foreground cursor-pointer"
            >
              &larr; Exit Deck
            </Button>
            <span className="font-bold text-sm text-foreground truncate max-w-[200px] sm:max-w-md">
              {activeDeck.title}
            </span>
          </div>

          <div className="text-xs font-mono font-bold text-muted">
            {currentCardIndex + 1} / {studyCards.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-raised h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {!isSessionComplete && currentCard ? (
          <div className="space-y-6">
            {/* 3D Flip Card Container */}
            <div
              onClick={() => setIsFlipped((prev) => !prev)}
              className="relative min-h-[320px] sm:min-h-[360px] w-full rounded-2xl border border-border/90 bg-gradient-to-br from-surface to-surface-raised p-8 sm:p-12 shadow-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:border-accent/40 select-none"
            >
              <div className="absolute top-4 left-4 text-[10px] uppercase font-bold tracking-wider text-muted flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-accent" />
                <span>{isFlipped ? 'Answer (Back)' : 'Question (Front)'}</span>
              </div>

              <div className="absolute top-4 right-4 text-[10px] font-semibold text-muted">
                {isFlipped ? 'Tap to hide' : 'Tap to reveal answer'}
              </div>

              {/* Card Content */}
              <div className="my-auto max-w-xl">
                <p className="text-lg sm:text-2xl font-extrabold text-foreground leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
              </div>

              <div className="text-[11px] text-muted-foreground mt-auto pt-4">
                {isFlipped ? (
                  <span>Rate your recall below or press 1, 2, 3, 4</span>
                ) : (
                  <span>Press Space / Enter to flip</span>
                )}
              </div>
            </div>

            {/* Rating Buttons (SM-2 Quality Ratings) */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              {!isFlipped ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setIsFlipped(true)}
                  className="w-full font-bold gap-2 cursor-pointer"
                >
                  <RotateCw className="h-4 w-4" />
                  <span>Reveal Answer (Space)</span>
                </Button>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => handleRateCard(1)}
                    className="flex flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger-muted p-3 text-danger hover:bg-danger/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span className="text-xs font-bold">1. Again</span>
                    <span className="text-[10px] text-danger/80 mt-0.5">&lt; 1 day</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard(3)}
                    className="flex flex-col items-center justify-center rounded-xl border border-warning/30 bg-warning-muted p-3 text-warning hover:bg-warning/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span className="text-xs font-bold">2. Hard</span>
                    <span className="text-[10px] text-warning/80 mt-0.5">1 day</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard(4)}
                    className="flex flex-col items-center justify-center rounded-xl border border-success/30 bg-success-muted p-3 text-success hover:bg-success/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span className="text-xs font-bold">3. Good</span>
                    <span className="text-[10px] text-success/80 mt-0.5">3-6 days</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard(5)}
                    className="flex flex-col items-center justify-center rounded-xl border border-accent/30 bg-accent-muted p-3 text-accent hover:bg-accent/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span className="text-xs font-bold">4. Easy</span>
                    <span className="text-[10px] text-accent/80 mt-0.5">&gt; 6 days</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Session Completed Screen */
          <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-4 shadow-xl">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <h3 className="text-xl font-extrabold text-foreground">
              Deck Review Complete!
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
              You reviewed <strong className="text-foreground">{reviewedCount} flashcard{reviewedCount === 1 ? '' : 's'}</strong>. Your next review dates have been automatically scheduled based on your recall accuracy.
            </p>

            <div className="pt-4 flex justify-center gap-3">
              <Button
                type="button"
                onClick={() => {
                  setActiveDeck(null)
                  refreshData()
                }}
                className="font-bold cursor-pointer"
              >
                Return to Decks
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    )
  }

  // ───────────────────────────────────────────────────────────────
  // RENDER: Decks Dashboard View
  // ───────────────────────────────────────────────────────────────
  return (
    <PageContainer width="wide" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Active Recall Flashcards
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Spaced repetition flashcard decks powered by the SuperMemo SM-2 memory algorithm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            className="gap-1.5 text-xs font-semibold text-accent border-accent/40 hover:bg-accent/10 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate with AI</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateDeckOpen(true)}
            className="gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Deck</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : decks.length === 0 ? (
        /* Empty State */
        <Card className="border-border/90 bg-surface p-12 text-center space-y-4 shadow-md">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/30">
            <Brain className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground sm:text-lg">No Flashcard Decks Yet</h3>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
            Create your first deck manually or let the AI Assistant instantly generate a study deck from your lecture notes or topics.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCreateSampleDeck}
              className="gap-1.5 cursor-pointer font-semibold"
            >
              <Brain className="h-3.5 w-3.5 text-accent" />
              <span>Try Sample Deck</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAiModalOpen(true)}
              className="gap-1.5 text-accent border-accent/40 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Deck Generator</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreateDeckOpen(true)}
              className="gap-1.5 font-bold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Deck</span>
            </Button>
          </div>
        </Card>
      ) : (
        /* Decks Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {decks.map((deck) => {
            const subName = subjectMap.get(deck.subject_id)

            return (
              <Card
                key={deck.id}
                className="border-border/90 bg-surface hover:border-accent/50 transition-all duration-200 shadow-md flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {subName && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent mb-1.5">
                          <Layers className="h-3 w-3" />
                          <span className="truncate">{subName}</span>
                        </span>
                      )}
                      <CardTitle className="text-base font-bold text-foreground truncate">
                        {deck.title}
                      </CardTitle>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDeck(deck.id)}
                      className="text-muted hover:text-danger rounded p-1 transition-colors cursor-pointer"
                      title="Delete Deck"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {deck.description && (
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {deck.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <div className="p-4 pt-0 border-t border-border/60 mt-auto flex items-center justify-between">
                  <span className="text-xs font-mono text-muted">
                    {deck.cardCount || 0} card{deck.cardCount === 1 ? '' : 's'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTargetDeckForCard(deck)
                        setIsAddCardOpen(true)
                      }}
                      className="text-xs text-muted hover:text-foreground cursor-pointer"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Card
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleStartStudy(deck)}
                      className="gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <span>Study</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Deck Modal */}
      <AnimatePresence>
        {isCreateDeckOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground">Create Flashcard Deck</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateDeckOpen(false)}
                  className="rounded-lg p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDeckSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Deck Title</label>
                  <input
                    type="text"
                    required
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    placeholder="e.g. Organic Chemistry Functional Groups"
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Subject (Optional)</label>
                  <select
                    value={newDeckSubjectId}
                    onChange={(e) => setNewDeckSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
                  >
                    <option value="">No linked subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={newDeckDesc}
                    onChange={(e) => setNewDeckDesc(e.target.value)}
                    placeholder="Brief summary of concepts in this deck..."
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateDeckOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold">
                    Create Deck
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Add Card Modal */}
      <AnimatePresence>
        {isAddCardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground">
                  Add Card to {targetDeckForCard?.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="rounded-lg p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddCardSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Front (Prompt / Question)</label>
                  <textarea
                    required
                    rows={2}
                    value={newCardFront}
                    onChange={(e) => setNewCardFront(e.target.value)}
                    placeholder="e.g. What is the time complexity of quicksort average case?"
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Back (Answer / Explanation)</label>
                  <textarea
                    required
                    rows={3}
                    value={newCardBack}
                    onChange={(e) => setNewCardBack(e.target.value)}
                    placeholder="e.g. O(n log n). Worst case is O(n^2) when pivot is poorly chosen."
                    className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddCardOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold">
                    Save Card
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Deck Generator Modal (Proposal & Approval Flow) */}
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
                  <h3 className="text-sm font-bold text-foreground">AI Flashcard Generator</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAiModalOpen(false)
                    setAiProposals(null)
                  }}
                  className="rounded-lg p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!aiProposals ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">
                      Study Topic or Paste Notes
                    </label>
                    <textarea
                      rows={3}
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. Mitochondria structure, cellular respiration, Krebs cycle, and ATP synthesis..."
                      className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Subject</label>
                      <select
                        value={aiSubjectId}
                        onChange={(e) => setAiSubjectId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden cursor-pointer"
                      >
                        <option value="">No subject</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Cards Count</label>
                      <input
                        type="number"
                        min="3"
                        max="12"
                        value={aiCardCount}
                        onChange={(e) => setAiCardCount(Number(e.target.value) || 6)}
                        className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAiModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={aiLoading || !aiTopic.trim()}
                      onClick={handleGenerateWithAI}
                      className="gap-2 font-bold cursor-pointer"
                    >
                      {aiLoading ? <LoadingSpinner size="xs" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span>{aiLoading ? 'Generating...' : 'Generate Cards'}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* AI Proposals Review & Approval List */
                <div className="space-y-3">
                  <p className="text-xs text-muted leading-relaxed">
                    Review and edit the proposed cards below before creating the deck:
                  </p>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {aiProposals.map((card, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-accent/40 bg-surface-raised/70 p-3 text-xs space-y-2 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={card.selected}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setAiProposals((prev) =>
                                  prev.map((c, i) => (i === idx ? { ...c, selected: checked } : c)),
                                )
                              }}
                              className="rounded border-border text-accent focus:ring-accent"
                            />
                            <span>Card {idx + 1}</span>
                          </label>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={card.front}
                            onChange={(e) => {
                              const val = e.target.value
                              setAiProposals((prev) =>
                                prev.map((c, i) => (i === idx ? { ...c, front: val } : c)),
                              )
                            }}
                            placeholder="Front / Question"
                            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-accent focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <textarea
                            rows={2}
                            value={card.back}
                            onChange={(e) => {
                              const val = e.target.value
                              setAiProposals((prev) =>
                                prev.map((c, i) => (i === idx ? { ...c, back: val } : c)),
                              )
                            }}
                            placeholder="Back / Answer"
                            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-accent focus:outline-hidden resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-border/60">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAiProposals(null)}
                      className="text-xs"
                    >
                      &larr; Back
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      disabled={aiLoading}
                      onClick={handleApproveAICards}
                      className="gap-1.5 font-bold cursor-pointer"
                    >
                      {aiLoading ? <LoadingSpinner size="xs" /> : <Check className="h-3.5 w-3.5" />}
                      <span>
                        Approve & Create ({aiProposals.filter((c) => c.selected).length} cards)
                      </span>
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
