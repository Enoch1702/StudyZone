import { supabase } from '../lib/supabase'

/**
 * Service handling CRUD operations for the tasks table in Supabase.
 * Enforces user isolation backed by Supabase Row Level Security (auth.uid() = user_id).
 *
 * Schema status values: 'pending' | 'in-progress' | 'completed' | 'archived'
 * Schema priority values: 'low' | 'medium' | 'high' | 'urgent'
 */

/**
 * Fetch all tasks belonging to the authenticated user.
 * Ordered by due_date ascending (nulls last), then created_at ascending.
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export async function getTasks(userId) {
  if (!userId) {
    return { data: null, error: new Error('User ID is required to fetch tasks.') }
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error) {
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch tasks.'),
    }
  }
}

/**
 * Create a new task for the authenticated user.
 * @param {Object} params
 * @param {string} params.userId - Authenticated user UUID (from Supabase session)
 * @param {string|null} params.subjectId - Optional subject UUID
 * @param {string} params.title - Task title (required, non-empty)
 * @param {string} [params.description] - Optional description
 * @param {string} [params.priority] - 'low' | 'medium' | 'high' | 'urgent'
 * @param {string} [params.status] - 'pending' | 'in-progress' | 'completed' | 'archived'
 * @param {string|null} [params.dueDate] - ISO date string or null
 * @param {number|null} [params.estimatedMinutes] - Positive integer or null
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createTask({
  userId,
  subjectId,
  title,
  description,
  priority = 'medium',
  status = 'pending',
  dueDate,
  estimatedMinutes,
}) {
  if (!userId) {
    return { data: null, error: new Error('Authenticated user is required to create a task.') }
  }

  const cleanTitle = title?.trim()
  if (!cleanTitle) {
    return { data: null, error: new Error('Task title cannot be empty.') }
  }

  if (estimatedMinutes !== null && estimatedMinutes !== undefined && estimatedMinutes !== '') {
    const mins = Number(estimatedMinutes)
    if (!Number.isInteger(mins) || mins < 0) {
      return { data: null, error: new Error('Estimated minutes must be a positive whole number.') }
    }
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: userId,
          subject_id: subjectId || null,
          title: cleanTitle,
          description: description?.trim() || null,
          priority: priority || 'medium',
          status: status || 'pending',
          due_date: dueDate || null,
          estimated_minutes:
            estimatedMinutes !== null && estimatedMinutes !== undefined && estimatedMinutes !== ''
              ? Number(estimatedMinutes)
              : null,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
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
      error: err instanceof Error ? err : new Error('Failed to create task.'),
    }
  }
}

/**
 * Update an existing task owned by the authenticated user.
 * @param {Object} params
 * @param {string} params.id - Task UUID
 * @param {string} params.userId - Authenticated user UUID
 * @param {string|null} params.subjectId
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {string} [params.priority]
 * @param {string} [params.status]
 * @param {string|null} [params.dueDate]
 * @param {number|null} [params.estimatedMinutes]
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateTask({
  id,
  userId,
  subjectId,
  title,
  description,
  priority,
  status,
  dueDate,
  estimatedMinutes,
}) {
  if (!id || !userId) {
    return { data: null, error: new Error('Task ID and user ID are required.') }
  }

  const cleanTitle = title?.trim()
  if (!cleanTitle) {
    return { data: null, error: new Error('Task title cannot be empty.') }
  }

  if (estimatedMinutes !== null && estimatedMinutes !== undefined && estimatedMinutes !== '') {
    const mins = Number(estimatedMinutes)
    if (!Number.isInteger(mins) || mins < 0) {
      return { data: null, error: new Error('Estimated minutes must be a positive whole number.') }
    }
  }

  try {
    // Determine completed_at based on status transition
    const updates = {
      subject_id: subjectId || null,
      title: cleanTitle,
      description: description?.trim() || null,
      priority: priority || 'medium',
      status: status || 'pending',
      due_date: dueDate || null,
      estimated_minutes:
        estimatedMinutes !== null && estimatedMinutes !== undefined && estimatedMinutes !== ''
          ? Number(estimatedMinutes)
          : null,
      updated_at: new Date().toISOString(),
    }

    // Sync completed_at with status
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    } else {
      updates.completed_at = null
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
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
      error: err instanceof Error ? err : new Error('Failed to update task.'),
    }
  }
}

/**
 * Toggle task completion state.
 * Completed → sets status='completed' and completed_at=now()
 * Uncompleted → sets status='pending' and completed_at=null
 *
 * @param {Object} params
 * @param {string} params.id - Task UUID
 * @param {string} params.userId - Authenticated user UUID
 * @param {boolean} params.isCompleted - Current completed state (true = currently completed)
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function toggleTaskComplete({ id, userId, isCompleted }) {
  if (!id || !userId) {
    return { data: null, error: new Error('Task ID and user ID are required.') }
  }

  const newStatus = isCompleted ? 'pending' : 'completed'
  const newCompletedAt = isCompleted ? null : new Date().toISOString()

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newCompletedAt,
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
      error: err instanceof Error ? err : new Error('Failed to update task completion.'),
    }
  }
}

/**
 * Delete a task owned by the authenticated user.
 * @param {Object} params
 * @param {string} params.id - Task UUID
 * @param {string} params.userId - Authenticated user UUID
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deleteTask({ id, userId }) {
  if (!id || !userId) {
    return { error: new Error('Task ID and user ID are required.') }
  }

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete task.'),
    }
  }
}
