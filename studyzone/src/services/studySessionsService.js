import { supabase } from '../lib/supabase'

/**
 * Service handling operations for the study_sessions table in Supabase.
 * Enforces user isolation backed by Supabase Row Level Security (auth.uid() = user_id).
 */

/**
 * Fetch all study sessions for the authenticated user within a date range.
 * @param {string} userId
 * @param {string} startISO - ISO start of range (inclusive)
 * @param {string} endISO - ISO end of range (inclusive)
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export async function getStudySessionsForWeek(userId, startISO, endISO) {
  if (!userId) {
    return { data: null, error: new Error('User ID is required.') }
  }

  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startISO)
      .lte('started_at', endISO)
      .order('started_at', { ascending: true })

    if (error) return { data: null, error }
    return { data: data || [], error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch study sessions.'),
    }
  }
}

/**
 * Fetch all study sessions for the authenticated user.
 * @param {string} userId
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export async function getStudySessions(userId) {
  if (!userId) {
    return { data: [], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('id, subject_id, duration_minutes, started_at')
      .eq('user_id', userId)

    if (error) return { data: [], error }
    return { data: data || [], error: null }
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Failed to fetch study sessions.'),
    }
  }
}

/**
 * Create a new study session for the authenticated user.
 * started_at is set to (now - duration_minutes) and ended_at to now for manual logging.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string|null} params.subjectId
 * @param {string|null} params.taskId
 * @param {number} params.durationMinutes - positive integer
 * @param {string} [params.notes]
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createStudySession(params = {}) {
  const userId = params.userId || params.user_id
  const subjectId = params.subjectId !== undefined ? params.subjectId : params.subject_id
  const taskId = params.taskId !== undefined ? params.taskId : params.task_id
  const durationMinutes = params.durationMinutes !== undefined ? params.durationMinutes : params.duration_minutes
  const notes = params.notes

  if (!userId) {
    return { data: null, error: new Error('Authenticated user is required.') }
  }

  const mins = Number(durationMinutes)
  if (!Number.isInteger(mins) || mins <= 0) {
    return { data: null, error: new Error('Duration must be a positive whole number of minutes.') }
  }

  const endedAt = new Date()
  const startedAt = new Date(endedAt.getTime() - mins * 60 * 1000)

  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([
        {
          user_id: userId,
          subject_id: subjectId || null,
          task_id: taskId || null,
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_minutes: mins,
          notes: notes?.trim() || null,
        },
      ])
      .select()
      .single()

    if (error) return { data: null, error }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create study session.'),
    }
  }
}

/**
 * Update an existing study session (e.g. link subject, task, or add reflection after timer completion).
 * @param {string} sessionId
 * @param {string} userId
 * @param {Object} updates
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateStudySession(sessionId, userId, updates = {}) {
  if (!sessionId || !userId) {
    return { data: null, error: new Error('Session ID and User ID are required.') }
  }

  const payload = {}
  if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null
  if (updates.taskId !== undefined) payload.task_id = updates.taskId || null
  if (updates.notes !== undefined) payload.notes = updates.notes ? updates.notes.trim() : null

  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .update(payload)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return { data: null, error }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update study session.'),
    }
  }
}
