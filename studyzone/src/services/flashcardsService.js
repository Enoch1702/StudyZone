import { supabase } from '../lib/supabase'

const LOCAL_DECKS_CACHE_KEY = 'studyzone_cache_flashcard_decks_'
const LOCAL_CARDS_CACHE_KEY = 'studyzone_cache_flashcards_'

function getCachedDecks(userId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_DECKS_CACHE_KEY}${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCachedDecks(userId, decks) {
  try {
    localStorage.setItem(`${LOCAL_DECKS_CACHE_KEY}${userId}`, JSON.stringify(decks))
  } catch {
    // ignore
  }
}

function getCachedCards(userId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_CARDS_CACHE_KEY}${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCachedCards(userId, cards) {
  try {
    localStorage.setItem(`${LOCAL_CARDS_CACHE_KEY}${userId}`, JSON.stringify(cards))
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
    // Successful recall
    if (reps === 0) {
      interval = 1
    } else if (reps === 1) {
      interval = 6
    } else {
      interval = Math.max(1, Math.round(interval * ef))
    }
    reps += 1
  } else {
    // Failed recall: reset repetitions to 0 and interval to 1 day
    reps = 0
    interval = 1
  }

  // Update Easiness Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (ef < 1.3) ef = 1.3 // Minimum EF floor

  // Calculate next review date deterministically
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    nextInterval: interval,
    newRepetitions: reps,
    newEasinessFactor: parseFloat(ef.toFixed(3)),
    nextReviewAt: nextReviewDate.toISOString(),
  }
}

// ─── FLASHCARD DECKS CRUD (OPTION A: SUPABASE PRIMARY + READ CACHE) ───

export async function getFlashcardDecks(userId) {
  if (!userId) return { data: [], error: null }

  try {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*, flashcards(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase decks fetch failed, falling back to cache:', error)
      return { data: getCachedDecks(userId), error }
    }

    const formatted = (data || []).map((d) => ({
      ...d,
      cardCount: d.flashcards?.[0]?.count || 0,
    }))

    // Update read-through cache
    setCachedDecks(userId, formatted)
    return { data: formatted, error: null }
  } catch (err) {
    console.warn('Network error fetching flashcard decks, using cache:', err)
    return { data: getCachedDecks(userId), error: null }
  }
}

export async function createFlashcardDeck({ userId, subjectId, title, description }) {
  if (!userId || !title) {
    return { data: null, error: new Error('Title and user are required') }
  }

  try {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: userId,
        subject_id: subjectId || null,
        title: title.trim(),
        description: description ? description.trim() : null,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    const deckWithCount = { ...data, cardCount: 0 }
    const cached = getCachedDecks(userId)
    setCachedDecks(userId, [deckWithCount, ...cached])

    return { data: deckWithCount, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function deleteFlashcardDeck(deckId, userId) {
  if (!deckId || !userId) return { error: null }

  try {
    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', userId)

    if (!error) {
      const cached = getCachedDecks(userId)
      setCachedDecks(userId, cached.filter((d) => d.id !== deckId))

      const cachedCards = getCachedCards(userId)
      setCachedCards(userId, cachedCards.filter((c) => c.deck_id !== deckId))
    }

    return { error }
  } catch (err) {
    return { error: err }
  }
}

// ─── FLASHCARDS CRUD & REVIEWS ───────────────────────────────────

export async function getFlashcards(deckId, userId) {
  if (!deckId || !userId) return { data: [], error: null }

  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('Supabase flashcards fetch failed, using cache:', error)
      const cached = getCachedCards(userId).filter((c) => c.deck_id === deckId)
      return { data: cached, error }
    }

    // Merge into local cards cache
    const existingCards = getCachedCards(userId).filter((c) => c.deck_id !== deckId)
    setCachedCards(userId, [...existingCards, ...(data || [])])

    return { data: data || [], error: null }
  } catch {
    const cached = getCachedCards(userId).filter((c) => c.deck_id === deckId)
    return { data: cached, error: null }
  }
}

export async function getAllDueFlashcards(userId) {
  if (!userId) return { data: [], error: null }
  const nowISO = new Date().toISOString()

  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*, flashcard_decks(title, subject_id)')
      .eq('user_id', userId)
      .lte('next_review_at', nowISO)
      .order('next_review_at', { ascending: true })

    if (error) {
      const cached = getCachedCards(userId).filter(
        (c) => !c.next_review_at || c.next_review_at <= nowISO,
      )
      return { data: cached, error }
    }

    return { data: data || [], error: null }
  } catch {
    const cached = getCachedCards(userId).filter(
      (c) => !c.next_review_at || c.next_review_at <= nowISO,
    )
    return { data: cached, error: null }
  }
}

export async function createFlashcard({ deckId, userId, front, back }) {
  if (!deckId || !userId || !front || !back) {
    return { data: null, error: new Error('Front, back, deck, and user are required') }
  }

  try {
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        deck_id: deckId,
        user_id: userId,
        front: front.trim(),
        back: back.trim(),
      })
      .select()
      .single()

    if (error) return { data: null, error }

    const cached = getCachedCards(userId)
    setCachedCards(userId, [...cached, data])

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function createBulkFlashcards({ deckId, userId, cards = [] }) {
  if (!deckId || !userId || cards.length === 0) return { data: [], error: null }

  try {
    const dbPayload = cards.map((c) => ({
      deck_id: deckId,
      user_id: userId,
      front: c.front.trim(),
      back: c.back.trim(),
    }))

    const { data, error } = await supabase.from('flashcards').insert(dbPayload).select()

    if (error) return { data: [], error }

    const cached = getCachedCards(userId)
    setCachedCards(userId, [...cached, ...(data || [])])

    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

export async function deleteFlashcard(cardId, userId) {
  if (!cardId || !userId) return { error: null }

  try {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId)

    if (!error) {
      const cached = getCachedCards(userId)
      setCachedCards(userId, cached.filter((c) => c.id !== cardId))
    }

    return { error }
  } catch (err) {
    return { error: err }
  }
}

/**
 * Reviews a card: calculates SuperMemo SM-2, updates the card in Supabase,
 * records the review event to flashcard_reviews, and syncs the cache.
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

    // Update read-through cache
    const cached = getCachedCards(userId)
    setCachedCards(
      userId,
      cached.map((c) =>
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

    return { error: cardRes.error }
  } catch (err) {
    return { error: err }
  }
}
