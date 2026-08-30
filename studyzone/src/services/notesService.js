import { supabase } from '../lib/supabase'

const LOCAL_NOTES_CACHE_KEY = 'studyzone_cache_study_notes_'

function getCachedNotes(userId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_NOTES_CACHE_KEY}${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCachedNotes(userId, notes) {
  try {
    localStorage.setItem(`${LOCAL_NOTES_CACHE_KEY}${userId}`, JSON.stringify(notes))
  } catch {
    // ignore
  }
}

/**
 * Normalizes database / payload note fields to standard object shape with camelCase and snake_case compatibility.
 */
function normalizeNote(n) {
  if (!n) return null
  return {
    id: n.id,
    userId: n.user_id || n.userId,
    user_id: n.user_id || n.userId,
    subjectId: n.subject_id ?? n.subjectId ?? null,
    subject_id: n.subject_id ?? n.subjectId ?? null,
    title: n.title || 'Untitled Note',
    content: n.content || '',
    summary: n.summary || '',
    tags: Array.isArray(n.tags) ? n.tags : [],
    isPinned: Boolean(n.is_pinned ?? n.isPinned),
    is_pinned: Boolean(n.is_pinned ?? n.isPinned),
    isArchived: Boolean(n.is_archived ?? n.isArchived),
    is_archived: Boolean(n.is_archived ?? n.isArchived),
    createdAt: n.created_at || n.createdAt || new Date().toISOString(),
    created_at: n.created_at || n.createdAt || new Date().toISOString(),
    updatedAt: n.updated_at || n.updatedAt || new Date().toISOString(),
    updated_at: n.updated_at || n.updatedAt || new Date().toISOString(),
  }
}

/**
 * Fetches notes for the authenticated user with optional subject, tag, search, archive, and sort filters.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.subjectId]
 * @param {string} [options.tag]
 * @param {string} [options.searchQuery]
 * @param {'updated_desc'|'created_desc'|'title_asc'} [options.sortBy='updated_desc']
 * @param {boolean} [options.includeArchived=false]
 * @returns {Promise<{ data: Array, error: any }>}
 */
export async function getNotes(userId, options = {}) {
  if (!userId) return { data: [], error: null }

  const {
    subjectId = null,
    tag = null,
    sortBy = 'updated_desc',
    includeArchived = false,
  } = options

  try {
    let query = supabase
      .from('study_notes')
      .select('*')
      .eq('user_id', userId)

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    // Sort order
    if (sortBy === 'created_desc') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'title_asc') {
      query = query.order('title', { ascending: true })
    } else {
      // Default: updated_desc
      query = query.order('updated_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.warn('Supabase notes fetch error, falling back to local cache:', error)
      const cached = getCachedNotes(userId).map(normalizeNote)
      return { data: applyClientFilters(cached, options), error: null }
    }

    const normalized = (data || []).map(normalizeNote)
    setCachedNotes(userId, normalized)

    // Apply any text search filter client-side for immediate full-text responsiveness
    return { data: applyClientFilters(normalized, options), error: null }
  } catch (err) {
    console.warn('Error in getNotes, using local fallback:', err)
    const cached = getCachedNotes(userId).map(normalizeNote)
    return { data: applyClientFilters(cached, options), error: null }
  }
}

/**
 * Applies client-side search query, subject, tag, and sort filters.
 */
function applyClientFilters(notes, options = {}) {
  const {
    subjectId = null,
    tag = null,
    searchQuery = '',
    sortBy = 'updated_desc',
    includeArchived = false,
  } = options

  let filtered = [...notes]

  if (!includeArchived) {
    filtered = filtered.filter((n) => !n.isArchived)
  }

  if (subjectId) {
    filtered = filtered.filter((n) => n.subjectId === subjectId)
  }

  if (tag) {
    filtered = filtered.filter((n) => n.tags && n.tags.includes(tag))
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.summary && n.summary.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(q))),
    )
  }

  filtered.sort((a, b) => {
    // Pinned notes bubble to the top if sorting by updated or created
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1
    }

    if (sortBy === 'created_desc') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    }
    if (sortBy === 'title_asc') {
      return a.title.localeCompare(b.title)
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })

  return filtered
}

/**
 * Fetches a single note by ID.
 */
export async function getNoteById(noteId, userId) {
  if (!noteId || !userId) return { data: null, error: new Error('ID and user required') }

  try {
    const { data, error } = await supabase
      .from('study_notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single()

    if (error) {
      const cached = getCachedNotes(userId).find((n) => n.id === noteId)
      return { data: cached ? normalizeNote(cached) : null, error: null }
    }

    return { data: normalizeNote(data), error: null }
  } catch {
    const cached = getCachedNotes(userId).find((n) => n.id === noteId)
    return { data: cached ? normalizeNote(cached) : null, error: null }
  }
}

/**
 * Creates a new note with automatic resilience fallback.
 */
export async function createNote({
  userId,
  subjectId = null,
  title = 'Untitled Note',
  content = '',
  summary = null,
  tags = [],
  isPinned = false,
}) {
  if (!userId) return { data: null, error: new Error('User ID is required') }

  const nowISO = new Date().toISOString()
  const payload = {
    user_id: userId,
    subject_id: subjectId || null,
    title: (title || 'Untitled Note').trim(),
    content: content || '',
    summary: summary ? summary.trim() : null,
    tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
    is_pinned: Boolean(isPinned),
    is_archived: false,
    created_at: nowISO,
    updated_at: nowISO,
  }

  try {
    const { data, error } = await supabase
      .from('study_notes')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.warn('Supabase createNote error, using local fallback:', error)
      const localNote = normalizeNote({
        id: crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}`,
        ...payload,
      })
      const cached = getCachedNotes(userId)
      setCachedNotes(userId, [localNote, ...cached])
      return { data: localNote, error: null }
    }

    const normalized = normalizeNote(data)
    const cached = getCachedNotes(userId)
    setCachedNotes(userId, [normalized, ...cached.filter((n) => n.id !== normalized.id)])
    return { data: normalized, error: null }
  } catch (err) {
    console.warn('Network error in createNote, saving to local fallback:', err)
    const localNote = normalizeNote({
      id: crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}`,
      ...payload,
    })
    const cached = getCachedNotes(userId)
    setCachedNotes(userId, [localNote, ...cached])
    return { data: localNote, error: null }
  }
}

/**
 * Updates an existing note.
 */
export async function updateNote({
  noteId,
  userId,
  title,
  content,
  summary,
  tags,
  isPinned,
  isArchived,
  subjectId,
}) {
  if (!noteId || !userId) return { data: null, error: new Error('Note ID and User ID required') }

  const nowISO = new Date().toISOString()
  const updates = {
    updated_at: nowISO,
  }

  if (title !== undefined) updates.title = title.trim() || 'Untitled Note'
  if (content !== undefined) updates.content = content
  if (summary !== undefined) updates.summary = summary ? summary.trim() : null
  if (tags !== undefined) {
    updates.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : []
  }
  if (isPinned !== undefined) updates.is_pinned = Boolean(isPinned)
  if (isArchived !== undefined) updates.is_archived = Boolean(isArchived)
  if (subjectId !== undefined) updates.subject_id = subjectId || null

  // Immediately update local cache for instant UI feedback
  const cached = getCachedNotes(userId)
  const existing = cached.find((n) => n.id === noteId)
  const updatedLocal = normalizeNote({
    ...(existing || {}),
    ...updates,
    id: noteId,
    user_id: userId,
  })
  setCachedNotes(
    userId,
    cached.map((n) => (n.id === noteId ? updatedLocal : n)),
  )

  try {
    const { data, error } = await supabase
      .from('study_notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.warn('Supabase updateNote error, saved locally:', error)
      return { data: updatedLocal, error: null }
    }

    const normalized = normalizeNote(data)
    setCachedNotes(
      userId,
      cached.map((n) => (n.id === noteId ? normalized : n)),
    )
    return { data: normalized, error: null }
  } catch (err) {
    console.warn('Network error in updateNote, saved locally:', err)
    return { data: updatedLocal, error: null }
  }
}

/**
 * Deletes a note permanently.
 */
export async function deleteNote(noteId, userId) {
  if (!noteId || !userId) return { error: null }

  const cached = getCachedNotes(userId)
  setCachedNotes(userId, cached.filter((n) => n.id !== noteId))

  try {
    await supabase
      .from('study_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId)

    return { error: null }
  } catch (err) {
    console.warn('Error deleting note from Supabase (removed from cache):', err)
    return { error: null }
  }
}

/**
 * Toggles the pinned status of a note.
 */
export async function togglePinNote(noteId, userId, isPinned) {
  return updateNote({ noteId, userId, isPinned })
}

/**
 * Archives or restores a note.
 */
export async function archiveNote(noteId, userId, isArchived) {
  return updateNote({ noteId, userId, isArchived })
}

/**
 * Gets all notes for a specific subject.
 */
export async function getNotesBySubject(userId, subjectId) {
  return getNotes(userId, { subjectId })
}

/**
 * Global search across notes for CommandPalette and Global Search.
 */
export async function searchNotes(userId, query, limit = 5) {
  if (!userId || !query || !query.trim()) return { data: [], error: null }
  const q = query.trim().toLowerCase()

  try {
    const { data: allNotes } = await getNotes(userId, { includeArchived: false })
    const matched = (allNotes || []).filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.summary && n.summary.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(q))),
    )

    return { data: matched.slice(0, limit), error: null }
  } catch (err) {
    return { data: [], error: err }
  }
}

/**
 * Creates starter / sample study note for new users.
 */
export async function createSampleNote(userId, subjectId = null) {
  if (!userId) return { data: null, error: null }

  const sampleContent = `# 🧠 Active Recall & Cognitive Load Theory

## Core Principles
1. **The Testing Effect**: Retrieving knowledge strengthens neural synaptic pathways significantly more than passive re-reading.
2. **Cognitive Load Optimization**:
   - *Intrinsic Load*: Inherent difficulty of the subject matter.
   - *Extraneous Load*: Distractions and poor structure.
   - *Germane Load*: Mental effort dedicated to building schemas and understanding.

## Study Strategies
- **Feynman Technique**: Explain complex concepts in simple terms without jargon.
- **Interleaving**: Mix related topics (e.g., dynamic programming with tree traversal) rather than massed blocking.
- **Spaced Intervals**: Review on days 1, 3, 7, and 14 using SuperMemo SM-2.

> *"Memory is the residue of thought."* — Daniel T. Willingham`

  return createNote({
    userId,
    subjectId,
    title: '🧠 Learning Science: Active Recall & Cognitive Load',
    content: sampleContent,
    summary: 'Key insights into the testing effect, cognitive load management, and optimal spaced review strategies.',
    tags: ['Learning', 'CognitiveScience', 'StudyMethods'],
    isPinned: true,
  })
}
