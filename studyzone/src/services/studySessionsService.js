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
export async function createStudySession({ userId, subjectId, taskId, durationMinutes, notes }) {
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
