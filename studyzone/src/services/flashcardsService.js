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

// ─── FLASHCARD DECKS CRUD ──────────────────────────────────────────

export async function getFlashcardDecks(userId) {
  if (!userId) return { data: [], error: null }

  try {
    // 1. Fetch decks
    const { data: decksData, error: decksError } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (decksError) {
      console.warn('Supabase decks fetch error, using cache:', decksError)
      return { data: getCachedDecks(userId), error: null }
    }

    // 2. Fetch cards to compute cardCount accurately without fragile join syntax
    const { data: cardsData } = await supabase
      .from('flashcards')
      .select('id, deck_id')
      .eq('user_id', userId)

    const countMap = new Map()
    for (const c of cardsData || []) {
      countMap.set(c.deck_id, (countMap.get(c.deck_id) || 0) + 1)
    }

    const formatted = (decksData || []).map((d) => ({
      ...d,
      cardCount: countMap.get(d.id) || 0,
    }))

    // Save to cache
    setCachedDecks(userId, formatted)
    return { data: formatted, error: null }
  } catch (err) {
    console.warn('Error in getFlashcardDecks, using cache:', err)
    return { data: getCachedDecks(userId), error: null }
  }
}

export async function createFlashcardDeck({ userId, subjectId, title, description }) {
  if (!userId || !title) {
    return { data: null, error: new Error('Title and user are required') }
  }

  const payload = {
    user_id: userId,
    subject_id: subjectId || null,
    title: title.trim(),
    description: description ? description.trim() : null,
  }

  try {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.warn('Supabase create deck error, storing in local cache:', error)
      // Fallback local deck
      const localDeck = {
        id: crypto.randomUUID ? crypto.randomUUID() : `deck_${Date.now()}`,
        ...payload,
        cardCount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const cached = getCachedDecks(userId)
      setCachedDecks(userId, [localDeck, ...cached])
      return { data: localDeck, error: null }
    }

    const deckWithCount = { ...data, cardCount: 0 }
    const cached = getCachedDecks(userId)
    setCachedDecks(userId, [deckWithCount, ...cached.filter((d) => d.id !== deckWithCount.id)])

    return { data: deckWithCount, error: null }
  } catch (err) {
    console.warn('Network error in createFlashcardDeck, using local fallback:', err)
    const localDeck = {
      id: crypto.randomUUID ? crypto.randomUUID() : `deck_${Date.now()}`,
      ...payload,
      cardCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const cached = getCachedDecks(userId)
    setCachedDecks(userId, [localDeck, ...cached])
    return { data: localDeck, error: null }
  }
}

export async function deleteFlashcardDeck(deckId, userId) {
  if (!deckId || !userId) return { error: null }

  try {
    await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', userId)

    const cached = getCachedDecks(userId)
    setCachedDecks(userId, cached.filter((d) => d.id !== deckId))

    const cachedCards = getCachedCards(userId)
    setCachedCards(userId, cachedCards.filter((c) => c.deck_id !== deckId))

    return { error: null }
  } catch (err) {
    const cached = getCachedDecks(userId)
    setCachedDecks(userId, cached.filter((d) => d.id !== deckId))
    return { error: null }
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

    if (error || !data || data.length === 0) {
      const cached = getCachedCards(userId).filter((c) => c.deck_id === deckId)
      if (cached.length > 0) return { data: cached, error: null }
      if (error) return { data: [], error }
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

    if (error || !data || data.length === 0) {
      const cached = getCachedCards(userId).filter(
        (c) => !c.next_review_at || c.next_review_at <= nowISO,
      )
      return { data: cached, error: null }
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

  const payload = {
    deck_id: deckId,
    user_id: userId,
    front: front.trim(),
    back: back.trim(),
    easiness_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase
      .from('flashcards')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.warn('Supabase create card error, using local storage fallback:', error)
      const localCard = {
        id: crypto.randomUUID ? crypto.randomUUID() : `card_${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const cached = getCachedCards(userId)
      setCachedCards(userId, [...cached, localCard])

      // Update deck count
      const decks = getCachedDecks(userId)
      setCachedDecks(
        userId,
        decks.map((d) => (d.id === deckId ? { ...d, cardCount: (d.cardCount || 0) + 1 } : d)),
      )
      return { data: localCard, error: null }
    }

    const cached = getCachedCards(userId)
    setCachedCards(userId, [...cached, data])

    // Update deck count
    const decks = getCachedDecks(userId)
    setCachedDecks(
      userId,
      decks.map((d) => (d.id === deckId ? { ...d, cardCount: (d.cardCount || 0) + 1 } : d)),
    )

    return { data, error: null }
  } catch (err) {
    console.warn('Network error in createFlashcard, using local storage fallback:', err)
    const localCard = {
      id: crypto.randomUUID ? crypto.randomUUID() : `card_${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const cached = getCachedCards(userId)
    setCachedCards(userId, [...cached, localCard])
    return { data: localCard, error: null }
  }
}

export async function createBulkFlashcards({ deckId, userId, cards = [] }) {
  if (!deckId || !userId || cards.length === 0) return { data: [], error: null }

  const nowISO = new Date().toISOString()
  const dbPayload = cards.map((c) => ({
    deck_id: deckId,
    user_id: userId,
    front: c.front.trim(),
    back: c.back.trim(),
    easiness_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: nowISO,
  }))

  try {
    const { data, error } = await supabase.from('flashcards').insert(dbPayload).select()

    if (error) {
      console.warn('Supabase bulk card error, using local storage fallback:', error)
      const localCards = dbPayload.map((c, i) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `card_${Date.now()}_${i}`,
        ...c,
        created_at: nowISO,
        updated_at: nowISO,
      }))
      const cached = getCachedCards(userId)
      setCachedCards(userId, [...cached, ...localCards])

      // Update deck count
      const decks = getCachedDecks(userId)
      setCachedDecks(
        userId,
        decks.map((d) =>
          d.id === deckId ? { ...d, cardCount: (d.cardCount || 0) + localCards.length } : d,
        ),
      )
      return { data: localCards, error: null }
    }

    const cached = getCachedCards(userId)
    setCachedCards(userId, [...cached, ...(data || [])])

    // Update deck count
    const decks = getCachedDecks(userId)
    setCachedDecks(
      userId,
      decks.map((d) =>
        d.id === deckId ? { ...d, cardCount: (d.cardCount || 0) + (data?.length || 0) } : d,
      ),
    )

    return { data: data || [], error: null }
  } catch (err) {
    console.warn('Network error in createBulkFlashcards, using local storage fallback:', err)
    const localCards = dbPayload.map((c, i) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `card_${Date.now()}_${i}`,
      ...c,
      created_at: nowISO,
      updated_at: nowISO,
    }))
    const cached = getCachedCards(userId)
    setCachedCards(userId, [...cached, ...localCards])
    return { data: localCards, error: null }
  }
}

export async function deleteFlashcard(cardId, userId) {
  if (!cardId || !userId) return { error: null }

  try {
    await supabase.from('flashcards').delete().eq('id', cardId).eq('user_id', userId)

    const cached = getCachedCards(userId)
    const cardToDelete = cached.find((c) => c.id === cardId)
    setCachedCards(userId, cached.filter((c) => c.id !== cardId))

    if (cardToDelete?.deck_id) {
      const decks = getCachedDecks(userId)
      setCachedDecks(
        userId,
        decks.map((d) =>
          d.id === cardToDelete.deck_id
            ? { ...d, cardCount: Math.max(0, (d.cardCount || 1) - 1) }
            : d,
        ),
      )
    }

    return { error: null }
  } catch (err) {
    const cached = getCachedCards(userId)
    setCachedCards(userId, cached.filter((c) => c.id !== cardId))
    return { error: null }
  }
}

/**
 * Reviews a card: calculates SuperMemo SM-2, updates the card in Supabase and local cache.
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

  // Always update local cache immediately for zero-lag UI
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

  try {
    await supabase
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
      .eq('user_id', userId)

    // Optional review event logging (won't fail if table is missing)
    try {
      await supabase.from('flashcard_reviews').insert({
        user_id: userId,
        flashcard_id: cardId,
        quality,
        previous_interval: currentCard?.interval_days || 0,
        new_interval: sm2Result.nextInterval,
        reviewed_at: nowISO,
      })
    } catch {
      // ignore review log error
    }

    return { error: null }
  } catch (err) {
    console.warn('Error saving card review to Supabase (cached locally):', err)
    return { error: null }
  }
}

/**
 * Creates a rich sample deck with verified active recall flashcards.
 */
export async function createSampleDeck(userId, subjectId = null) {
  if (!userId) return { data: null, error: null }

  const sampleDeckRes = await createFlashcardDeck({
    userId,
    subjectId,
    title: '🧠 Learning Science & CS Fundamentals',
    description: 'Starter deck covering active recall, SM-2 algorithms, and core computing concepts.',
  })

  const deck = sampleDeckRes.data
  if (!deck) return sampleDeckRes

  const sampleCards = [
    {
      front: 'What is Active Recall and why is it superior to passive rereading?',
      back: 'Active recall forces the brain to retrieve information from memory without looking, which strengthens neural pathways and synaptic plasticity far more than passive recognition.',
    },
    {
      front: 'How does the SuperMemo SM-2 algorithm calculate repetition intervals?',
      back: 'SM-2 assigns an Easiness Factor (EF >= 1.3) based on recall quality (0-5). First interval is 1 day, second is 6 days, subsequent intervals are I = I_prev * EF.',
    },
    {
      front: 'What is the difference between Time Complexity and Space Complexity in algorithms?',
      back: 'Time complexity measures the execution time relative to input size N, while Space complexity measures additional memory consumption during execution.',
    },
    {
      front: 'What is the Ebbinghaus Forgetting Curve and how does Spaced Repetition counter it?',
      back: 'Memory retention decays exponentially over time without reinforcement. Reviewing material at expanding spaced intervals resets the curve and flattens memory decay.',
    },
    {
      front: 'Why are Pomodoro intervals (e.g. 25m focus / 5m break) effective for deep work?',
      back: 'They prevent cognitive fatigue by providing scheduled dopamine recovery periods, reducing task procrastination and maintaining peak prefrontal cortex alertness.',
    },
  ]

  await createBulkFlashcards({
    deckId: deck.id,
    userId,
    cards: sampleCards,
  })

  return { data: { ...deck, cardCount: sampleCards.length }, error: null }
}
