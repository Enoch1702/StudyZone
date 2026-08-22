import { supabase } from '../lib/supabase'

/**
 * Service handling CRUD operations for the deadlines table in Supabase.
 * Enforces user isolation backed by Supabase Row Level Security (auth.uid() = user_id).
 *
 * Schema deadline_type values: 'exam' | 'assignment' | 'project' | 'quiz' | 'presentation' | 'other'
 */

/**
 * Fetch all deadlines belonging to the authenticated user.
 * Ordered by due_date ascending so the most urgent deadlines appear first.
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export async function getDeadlines(userId) {
  if (!userId) {
    return { data: null, error: new Error('User ID is required to fetch deadlines.') }
  }

  try {
    const { data, error } = await supabase
      .from('deadlines')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })

    if (error) {
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch deadlines.'),
    }
  }
}

/**
 * Create a new deadline for the authenticated user.
 * @param {Object} params
 * @param {string} params.userId - Authenticated user UUID (from Supabase session)
 * @param {string|null} params.subjectId - Optional subject UUID
 * @param {string} params.title - Deadline title (required, non-empty)
 * @param {string} [params.description] - Optional description
 * @param {string} [params.deadlineType] - Schema allowed value
 * @param {string} params.dueDate - ISO date string (required)
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createDeadline({ userId, subjectId, title, description, deadlineType, dueDate }) {
  if (!userId) {
    return { data: null, error: new Error('Authenticated user is required to create a deadline.') }
  }

  const cleanTitle = title?.trim()
  if (!cleanTitle) {
    return { data: null, error: new Error('Deadline title cannot be empty.') }
  }

  if (!dueDate) {
    return { data: null, error: new Error('A due date is required.') }
  }

  const VALID_TYPES = ['exam', 'assignment', 'project', 'quiz', 'presentation', 'other']
  const type = deadlineType || 'assignment'
  if (!VALID_TYPES.includes(type)) {
    return { data: null, error: new Error('Invalid deadline type.') }
  }

  try {
    const { data, error } = await supabase
      .from('deadlines')
      .insert([
        {
          user_id: userId,
          subject_id: subjectId || null,
          title: cleanTitle,
          description: description?.trim() || null,
          deadline_type: type,
          due_date: dueDate,
        },
      ])
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create deadline.'),
    }
  }
}

/**
 * Update an existing deadline owned by the authenticated user.
 * @param {Object} params
 * @param {string} params.id - Deadline UUID
 * @param {string} params.userId - Authenticated user UUID
 * @param {string|null} params.subjectId
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {string} [params.deadlineType]
 * @param {string} params.dueDate - ISO date string (required)
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateDeadline({ id, userId, subjectId, title, description, deadlineType, dueDate }) {
  if (!id || !userId) {
    return { data: null, error: new Error('Deadline ID and user ID are required.') }
  }

  const cleanTitle = title?.trim()
  if (!cleanTitle) {
    return { data: null, error: new Error('Deadline title cannot be empty.') }
  }

  if (!dueDate) {
    return { data: null, error: new Error('A due date is required.') }
  }

  const VALID_TYPES = ['exam', 'assignment', 'project', 'quiz', 'presentation', 'other']
  const type = deadlineType || 'assignment'
  if (!VALID_TYPES.includes(type)) {
    return { data: null, error: new Error('Invalid deadline type.') }
  }

  try {
    const { data, error } = await supabase
      .from('deadlines')
      .update({
        subject_id: subjectId || null,
        title: cleanTitle,
        description: description?.trim() || null,
        deadline_type: type,
        due_date: dueDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update deadline.'),
    }
  }
}

/**
 * Delete a deadline owned by the authenticated user.
 * @param {Object} params
 * @param {string} params.id - Deadline UUID
 * @param {string} params.userId - Authenticated user UUID
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deleteDeadline({ id, userId }) {
  if (!id || !userId) {
    return { error: new Error('Deadline ID and user ID are required.') }
  }

  try {
    const { error } = await supabase
      .from('deadlines')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete deadline.'),
    }
  }
}
