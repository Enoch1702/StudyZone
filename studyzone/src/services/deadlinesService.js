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
export async function createDeadline(params = {}) {
  const userId = params.userId || params.user_id
  const subjectId = params.subjectId !== undefined ? params.subjectId : params.subject_id
  const title = params.title
  const description = params.description
  const deadlineType = params.deadlineType !== undefined ? params.deadlineType : params.deadline_type
  const dueDate = params.dueDate !== undefined ? params.dueDate : params.due_date

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
 */
export async function updateDeadline(params = {}) {
  const id = params.id
  const userId = params.userId || params.user_id
  const subjectId = params.subjectId !== undefined ? params.subjectId : params.subject_id
  const title = params.title
  const description = params.description
  const deadlineType = params.deadlineType !== undefined ? params.deadlineType : params.deadline_type
  const dueDate = params.dueDate !== undefined ? params.dueDate : params.due_date

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
 */
export async function deleteDeadline(params = {}) {
  const id = typeof params === 'object' ? params.id : params
  const userId = typeof params === 'object' ? (params.userId || params.user_id) : null

  if (!id) {
    return { error: new Error('Deadline ID is required.') }
  }

  try {
    let query = supabase.from('deadlines').delete().eq('id', id)
    if (userId) query = query.eq('user_id', userId)

    const { error } = await query
    if (error) return { error }
    return { error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete deadline.'),
    }
  }
}
