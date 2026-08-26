import { supabase } from '../lib/supabase'

const LOCAL_DECKS_KEY = 'studyzone_local_flashcard_decks_'
const LOCAL_CARDS_KEY = 'studyzone_local_flashcards_'

function getLocalDecks(userId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_DECKS_KEY}${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalDecks(userId, decks) {
  try {
    localStorage.setItem(`${LOCAL_DECKS_KEY}${userId}`, JSON.stringify(decks))
  } catch {
    // ignore
  }
}

function getLocalCards(userId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_CARDS_KEY}${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalCards(userId, cards) {
  try {
    localStorage.setItem(`${LOCAL_CARDS_KEY}${userId}`, JSON.stringify(cards))
  } catch {
    // ignore
  }
}

/**
 * Pure SuperMemo SM-2 Spaced Repetition Algorithm implementation.
 *
 * @param {Object} params
 * @param {number} params.quality - Score 0 to 5 (0: Blackout, 1: Wrong, 2: Wrong Easy, 3: Hard, 4: Good, 5: Perfect)
 * @param {number} params.repetitions - Consecutive successful reviews (n)
 * @param {number} params.previousInterval - Days between last reviews (I)
 * @param {number} params.easinessFactor - Easiness Factor (EF, default 2.5)
 * @returns {Object} { nextInterval, newRepetitions, newEasinessFactor, nextReviewAt }
 */
export function calculateSM2({
  quality,
  repetitions = 0,
  previousInterval = 0,
  easinessFactor = 2.5,
}) {
  const q = Math.max(0, Math.min(5, Math.round(Number(quality) || 0)))
  let ef = Number(easinessFactor) || 2.5
  let reps = Number(repetitions) || 0
  let interval = Number(previousInterval) || 0

  if (q >= 3) {
    // Correct response
    if (reps === 0) {
      interval = 1
    } else if (reps === 1) {
      interval = 6
    } else {
      interval = Math.max(1, Math.round(interval * ef))
    }
    reps += 1
  } else {
    // Incorrect response: reset interval to 1 day and repetitions to 0
    reps = 0
    interval = 1
  }

  // Update Easiness Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ef < 1.3) ef = 1.3 // Minimum EF floor

  // Calculate next review timestamp
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    nextInterval: interval,
    newRepetitions: reps,
    newEasinessFactor: parseFloat(ef.toFixed(3)),
    nextReviewAt: nextReviewDate.toISOString(),
  }
}

// ─── FLASHCARD DECKS CRUD ────────────────────────────────────────

export async function getFlashcardDecks(userId) {
  if (!userId) return { data: [], error: null }
  const localDecks = getLocalDecks(userId)

  try {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*, flashcards(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return { data: localDecks, error: null }
    }

    // Merge Supabase and Local decks
    const map = new Map()
    for (const d of localDecks) map.set(d.id, d)
    for (const d of data) {
      map.set(d.id, {
        ...d,
        cardCount: d.flashcards?.[0]?.count || 0,
      })
    }

    return { data: Array.from(map.values()), error: null }
  } catch {
    return { data: localDecks, error: null }
  }
}

export async function createFlashcardDeck({ userId, subjectId, title, description }) {
  if (!userId || !title) return { data: null, error: new Error('Title and user are required') }

  const nowISO = new Date().toISOString()
  const localDeck = {
    id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    subject_id: subjectId || null,
    title: title.trim(),
    description: description ? description.trim() : null,
    cardCount: 0,
    created_at: nowISO,
    updated_at: nowISO,
  }

  // Save to local
  const currentLocals = getLocalDecks(userId)
  saveLocalDecks(userId, [localDeck, ...currentLocals])

  try {
    const { data } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: userId,
        subject_id: subjectId || null,
        title: title.trim(),
        description: description ? description.trim() : null,
      })
      .select()
      .single()

    if (data) {
      saveLocalDecks(userId, [data, ...currentLocals.filter((d) => d.id !== localDeck.id)])
      return { data: { ...data, cardCount: 0 }, error: null }
    }

    return { data: localDeck, error: null }
  } catch {
    return { data: localDeck, error: null }
  }
}

export async function deleteFlashcardDeck(deckId, userId) {
  if (!deckId || !userId) return { error: null }

  const currentDecks = getLocalDecks(userId)
  saveLocalDecks(userId, currentDecks.filter((d) => d.id !== deckId))

  const currentCards = getLocalCards(userId)
  saveLocalCards(userId, currentCards.filter((c) => c.deck_id !== deckId))

  try {
    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    return { error: err }
  }
}

// ─── FLASHCARDS CRUD & REVIEWS ───────────────────────────────────

export async function getFlashcards(deckId, userId) {
  if (!deckId || !userId) return { data: [], error: null }
  const localCards = getLocalCards(userId).filter((c) => c.deck_id === deckId)

  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) {
      return { data: localCards, error: null }
    }

    const map = new Map()
    for (const c of localCards) map.set(c.id, c)
    for (const c of data) map.set(c.id, c)

    return { data: Array.from(map.values()), error: null }
  } catch {
    return { data: localCards, error: null }
  }
}

export async function getAllDueFlashcards(userId) {
  if (!userId) return { data: [], error: null }
  const nowISO = new Date().toISOString()
  const localCards = getLocalCards(userId).filter(
    (c) => !c.next_review_at || c.next_review_at <= nowISO,
  )

  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*, flashcard_decks(title, subject_id)')
      .eq('user_id', userId)
      .lte('next_review_at', nowISO)
      .order('next_review_at', { ascending: true })

    if (error || !data || data.length === 0) {
      return { data: localCards, error: null }
    }

    return { data, error: null }
  } catch {
    return { data: localCards, error: null }
  }
}

export async function createFlashcard({ deckId, userId, front, back }) {
  if (!deckId || !userId || !front || !back) {
    return { data: null, error: new Error('Front, back, deck, and user are required') }
  }

  const nowISO = new Date().toISOString()
  const localCard = {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deck_id: deckId,
    user_id: userId,
    front: front.trim(),
    back: back.trim(),
    easiness_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: nowISO,
    last_reviewed_at: null,
    created_at: nowISO,
    updated_at: nowISO,
  }

  const locals = getLocalCards(userId)
  saveLocalCards(userId, [...locals, localCard])

  try {
    const { data } = await supabase
      .from('flashcards')
      .insert({
        deck_id: deckId,
        user_id: userId,
        front: front.trim(),
        back: back.trim(),
      })
      .select()
      .single()

    if (data) {
      saveLocalCards(userId, [...locals.filter((c) => c.id !== localCard.id), data])
      return { data, error: null }
    }

    return { data: localCard, error: null }
  } catch {
    return { data: localCard, error: null }
  }
}

export async function createBulkFlashcards({ deckId, userId, cards = [] }) {
  if (!deckId || !userId || cards.length === 0) return { data: [], error: null }

  const nowISO = new Date().toISOString()
  const localInserts = cards.map((c) => ({
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deck_id: deckId,
    user_id: userId,
    front: c.front.trim(),
    back: c.back.trim(),
    easiness_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: nowISO,
    last_reviewed_at: null,
    created_at: nowISO,
    updated_at: nowISO,
  }))

  const locals = getLocalCards(userId)
  saveLocalCards(userId, [...locals, ...localInserts])

  try {
    const dbPayload = cards.map((c) => ({
      deck_id: deckId,
      user_id: userId,
      front: c.front.trim(),
      back: c.back.trim(),
    }))

    const { data } = await supabase.from('flashcards').insert(dbPayload).select()

    if (data) {
      saveLocalCards(userId, [
        ...locals.filter((c) => !localInserts.some((li) => li.id === c.id)),
        ...data,
      ])
      return { data, error: null }
    }

    return { data: localInserts, error: null }
  } catch {
    return { data: localInserts, error: null }
  }
}

export async function deleteFlashcard(cardId, userId) {
  if (!cardId || !userId) return { error: null }

  const locals = getLocalCards(userId)
  saveLocalCards(userId, locals.filter((c) => c.id !== cardId))

  try {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    return { error: err }
  }
}

/**
 * Reviews a card: calculates SM-2, updates the card, and logs to flashcard_reviews.
 */
export async function submitCardReview({ cardId, userId, quality, currentCard }) {
  if (!cardId || !userId) return { error: null }

  const sm2Result = calculateSM2({
    quality,
    repetitions: currentCard?.repetitions || 0,
    previousInterval: currentCard?.interval_days || 0,
    easinessFactor: currentCard?.easiness_factor || 2.5,
  })

  const nowISO = new Date().toISOString()

  // Update local storage card
  const locals = getLocalCards(userId)
  saveLocalCards(
    userId,
    locals.map((c) =>
      c.id === cardId
        ? {
            ...c,
            easiness_factor: sm2Result.newEasinessFactor,
            interval_days: sm2Result.nextInterval,
            repetitions: sm2Result.newRepetitions,
            next_review_at: sm2Result.nextReviewAt,
            last_reviewed_at: nowISO,
            updated_at: nowISO,
          }
        : c,
    ),
  )

  try {
    const [cardRes] = await Promise.all([
      supabase
        .from('flashcards')
        .update({
          easiness_factor: sm2Result.newEasinessFactor,
          interval_days: sm2Result.nextInterval,
          repetitions: sm2Result.newRepetitions,
          next_review_at: sm2Result.nextReviewAt,
          last_reviewed_at: nowISO,
          updated_at: nowISO,
        })
        .eq('id', cardId)
        .eq('user_id', userId),

      supabase.from('flashcard_reviews').insert({
        user_id: userId,
        flashcard_id: cardId,
        quality,
        previous_interval: currentCard?.interval_days || 0,
        new_interval: sm2Result.nextInterval,
        reviewed_at: nowISO,
      }),
    ])

    return { error: cardRes.error }
  } catch (err) {
    return { error: err }
  }
}
