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
 * @param {string|null} [params.subjectId] - Optional subject UUID
 * @param {string|null} [params.planId] - Optional learning plan UUID
 * @param {string|null} [params.milestoneId] - Optional learning milestone UUID
 * @param {string} params.title - Task title (required, non-empty)
 * @param {string} [params.description] - Optional description
 * @param {string} [params.priority] - 'low' | 'medium' | 'high' | 'urgent'
 * @param {string} [params.status] - 'pending' | 'in-progress' | 'completed' | 'archived'
 * @param {string|null} [params.dueDate] - ISO date string or null
 * @param {number|null} [params.estimatedMinutes] - Positive integer or null
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createTask(params = {}) {
  const userId = params.userId || params.user_id
  const subjectId = params.subjectId !== undefined ? params.subjectId : params.subject_id
  const planId = params.planId !== undefined ? params.planId : params.plan_id
  const milestoneId = params.milestoneId !== undefined ? params.milestoneId : params.milestone_id
  const title = params.title
  const description = params.description
  const priority = params.priority || 'medium'
  const status = params.status || 'pending'
  const dueDate = params.dueDate !== undefined ? params.dueDate : params.due_date
  const estimatedMinutes = params.estimatedMinutes !== undefined ? params.estimatedMinutes : params.estimated_minutes

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
          plan_id: planId || null,
          milestone_id: milestoneId || null,
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
 */
export async function updateTask(params = {}) {
  const id = params.id
  const userId = params.userId || params.user_id
  const subjectId = params.subjectId !== undefined ? params.subjectId : params.subject_id
  const planId = params.planId !== undefined ? params.planId : params.plan_id
  const milestoneId = params.milestoneId !== undefined ? params.milestoneId : params.milestone_id
  const title = params.title
  const description = params.description
  const priority = params.priority
  const status = params.status
  const dueDate = params.dueDate !== undefined ? params.dueDate : params.due_date
  const estimatedMinutes = params.estimatedMinutes !== undefined ? params.estimatedMinutes : params.estimated_minutes

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

    if (planId !== undefined) updates.plan_id = planId || null
    if (milestoneId !== undefined) updates.milestone_id = milestoneId || null

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
export async function toggleTaskComplete(params = {}) {
  const id = params.id
  const userId = params.userId || params.user_id
  const isCompleted = params.isCompleted !== undefined ? params.isCompleted : params.is_completed

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
 * Permanently delete a task belonging to the authenticated user.
 */
export async function deleteTask(params = {}) {
  const id = typeof params === 'object' ? params.id : params
  const userId = typeof params === 'object' ? (params.userId || params.user_id) : null

  if (!id) {
    return { error: new Error('Task ID is required.') }
  }

  try {
    let query = supabase.from('tasks').delete().eq('id', id)
    if (userId) query = query.eq('user_id', userId)

    const { error } = await query
    if (error) return { error }
    return { error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete task.'),
    }
  }
}
