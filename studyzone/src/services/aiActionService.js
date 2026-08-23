import { createTask } from './tasksService'
import { createDeadline } from './deadlinesService'

/**
 * Service for validating, duplicate-checking, and executing user-approved AI action proposals.
 * All operations execute within the authenticated user's session and are protected by Supabase RLS.
 */

/**
 * Checks if a proposed action title matches any existing item (case-insensitive normalized match).
 *
 * @param {Object} action - The proposed action ({ type, title })
 * @param {Array} existingTasks - User's current tasks
 * @param {Array} existingDeadlines - User's current deadlines
 * @returns {boolean}
 */
export function isDuplicateAction(action, existingTasks = [], existingDeadlines = []) {
  if (!action?.title) return false
  const normTitle = action.title.trim().toLowerCase()

  if (action.type === 'create_task') {
    return existingTasks.some(
      (t) => t.title && t.title.trim().toLowerCase() === normTitle && t.status !== 'completed',
    )
  }

  if (action.type === 'create_deadline') {
    return existingDeadlines.some(
      (d) => d.title && d.title.trim().toLowerCase() === normTitle,
    )
  }

  return false
}

/**
 * Validates an action proposal against schema constraints.
 *
 * @param {Object} action
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateActionProposal(action) {
  if (!action || typeof action !== 'object') {
    return { isValid: false, error: 'Invalid action object.' }
  }

  if (action.type !== 'create_task' && action.type !== 'create_deadline') {
    return { isValid: false, error: `Unsupported action type: ${action.type}` }
  }

  if (!action.title || typeof action.title !== 'string' || !action.title.trim()) {
    return { isValid: false, error: 'Action title is required.' }
  }

  if (action.type === 'create_deadline') {
    if (!action.due_date) {
      return { isValid: false, error: 'Due date is required for deadlines.' }
    }
    const d = new Date(action.due_date)
    if (isNaN(d.getTime())) {
      return { isValid: false, error: 'Invalid due date for deadline.' }
    }
  }

  return { isValid: true }
}

/**
 * Executes a list of approved action proposals against Supabase.
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user UUID
 * @param {Array<Object>} params.actions - List of actions approved by the user
 * @returns {Promise<{ successCount: number, failedCount: number, results: Array<{ id: string, success: boolean, error?: string }> }>}
 */
export async function executeApprovedActions({ userId, actions }) {
  if (!userId) {
    throw new Error('Authenticated user ID is required to execute actions.')
  }

  if (!Array.isArray(actions) || actions.length === 0) {
    return { successCount: 0, failedCount: 0, results: [] }
  }

  const results = []
  let successCount = 0
  let failedCount = 0

  for (const action of actions) {
    const validation = validateActionProposal(action)
    if (!validation.isValid) {
      results.push({ id: action.id, success: false, error: validation.error })
      failedCount++
      continue
    }

    try {
      if (action.type === 'create_task') {
        const res = await createTask({
          userId,
          title: action.title.trim(),
          description: action.description?.trim() || null,
          priority: action.priority || 'medium',
          dueDate: action.due_date || null,
          estimatedMinutes: action.estimated_minutes || null,
          subjectId: action.subject_id || null,
        })

        if (res.error) {
          results.push({ id: action.id, success: false, error: res.error.message || 'Failed to create task.' })
          failedCount++
        } else {
          results.push({ id: action.id, success: true, data: res.data })
          successCount++
        }
      } else if (action.type === 'create_deadline') {
        const res = await createDeadline({
          userId,
          title: action.title.trim(),
          description: action.description?.trim() || null,
          deadlineType: action.deadline_type || 'assignment',
          dueDate: action.due_date,
          subjectId: action.subject_id || null,
        })

        if (res.error) {
          results.push({ id: action.id, success: false, error: res.error.message || 'Failed to create deadline.' })
          failedCount++
        } else {
          results.push({ id: action.id, success: true, data: res.data })
          successCount++
        }
      }
    } catch (err) {
      results.push({
        id: action.id,
        success: false,
        error: err instanceof Error ? err.message : 'Execution error.',
      })
      failedCount++
    }
  }

  return { successCount, failedCount, results }
}
