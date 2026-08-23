import { supabase } from '../lib/supabase'

/**
 * Service handling CRUD operations and progress calculations for
 * learning_plans and learning_milestones tables in Supabase.
 * Enforces user isolation backed by Supabase Row Level Security (auth.uid() = user_id).
 */

// ---------------------------------------------------------------------------
// Learning Plans CRUD
// ---------------------------------------------------------------------------

/**
 * Fetch all learning plans for the authenticated user.
 * @param {string} userId
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export async function getLearningPlans(userId) {
  if (!userId) {
    return { data: null, error: new Error('User ID is required to fetch learning plans.') }
  }

  try {
    const { data, error } = await supabase
      .from('learning_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error }
    return { data: data || [], error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch learning plans.'),
    }
  }
}

/**
 * Fetch a single learning plan by ID.
 * @param {string} planId
 * @param {string} userId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function getLearningPlanById(planId, userId) {
  if (!planId || !userId) {
    return { data: null, error: new Error('Plan ID and User ID are required.') }
  }

  try {
    const { data, error } = await supabase
      .from('learning_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single()

    if (error) return { data: null, error }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch learning plan.'),
    }
  }
}

/**
 * Create a new learning plan.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {string} [params.targetDate] - ISO date or YYYY-MM-DD
 * @param {string} [params.status='active']
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createLearningPlan({
  userId,
  title,
  description = null,
  targetDate = null,
  status = 'active',
}) {
  if (!userId) {
    return { data: null, error: new Error('Authenticated user is required to create a plan.') }
  }

  const cleanTitle = title?.trim()
  if (!cleanTitle) {
    return { data: null, error: new Error('Plan title is required.') }
  }

  try {
    const { data, error } = await supabase
      .from('learning_plans')
      .insert({
        user_id: userId,
        title: cleanTitle,
        description: description?.trim() || null,
        target_date: targetDate || null,
        status: status || 'active',
      })
      .select()
      .single()

    if (error) return { data: null, error }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create learning plan.'),
    }
  }
}

/**
 * Update an existing learning plan.
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.userId
 * @param {string} [params.title]
 * @param {string} [params.description]
 * @param {string} [params.targetDate]
 * @param {string} [params.status]
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateLearningPlan({
  id,
  userId,
  title,
  description,
  targetDate,
  status,
}) {
  if (!id || !userId) {
    return { data: null, error: new Error('Plan ID and User ID are required for update.') }
  }

  const updates = {}
  if (title !== undefined) {
    const cleanTitle = title?.trim()
    if (!cleanTitle) return { data: null, error: new Error('Plan title cannot be empty.') }
    updates.title = cleanTitle
  }
  if (description !== undefined) updates.description = description?.trim() || null
  if (targetDate !== undefined) updates.target_date = targetDate || null
  if (status !== undefined) updates.status = status

  try {
    const { data, error } = await supabase
      .from('learning_plans')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return { data: null, error }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update learning plan.'),
    }
  }
}

/**
 * Delete a learning plan. (Tasks will have plan_id SET NULL via FK constraint).
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.userId
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deleteLearningPlan({ id, userId }) {
  if (!id || !userId) {
    return { error: new Error('Plan ID and User ID are required to delete a plan.') }
  }

  try {
    const { error } = await supabase
      .from('learning_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return { error: error || null }
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete learning plan.'),
    }
  }
}

/**
 * Quick status update helper.
 */
export async function updateLearningPlanStatus({ id, userId, status }) {
  return updateLearningPlan({ id, userId, status })
}

// ---------------------------------------------------------------------------
// Milestones CRUD
// ---------------------------------------------------------------------------

/**
 * Fetch all milestones for a given learning plan.
 * @param {string} planId
 * @param {string} userId
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export async function getMilestonesForPlan(planId, userId) {
  if (!planId || !userId) {
    return { data: null, error: new Error('Plan ID and User ID are required.') }
  }

  try {
    const { data, error } = await supabase
      .from('learning_milestones')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (error) return { data: null, error }
    return { data: data || [], error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch milestones.'),
    }
  }
}

/**
 * Create a new milestone inside a learning plan.
 * @param {Object} params
 * @param {string} params.planId
 * @param {string} params.userId
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {number} [params.position=1]
 * @param {string} [params.targetDate]
 * @param {string} [params.status='pending']
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function createMilestone({
  planId,
  userId,
  title,
  description = null,
  position = 1,
  targetDate = null,
  status = 'pending',
}) {
  if (!planId || !userId) {
    return { data: null, error: new Error('Plan ID and User ID are required to create a milestone.') }
  }

  const cleanTitle = title?.trim()
  if (!cleanTitle) {
    return { data: null, error: new Error('Milestone title is required.') }
  }

  try {
    const { data, error } = await supabase
      .from('learning_milestones')
      .insert({
        plan_id: planId,
        user_id: userId,
        title: cleanTitle,
        description: description?.trim() || null,
        position: Number(position) || 1,
        target_date: targetDate || null,
        status: status || 'pending',
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) return { data: null, error }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create milestone.'),
    }
  }
}

/**
 * Update a milestone.
 */
export async function updateMilestone({
  id,
  userId,
  title,
  description,
  position,
  targetDate,
  status,
  completedAt,
}) {
  if (!id || !userId) {
    return { data: null, error: new Error('Milestone ID and User ID are required.') }
  }

  const updates = {}
  if (title !== undefined) {
    const cleanTitle = title?.trim()
    if (!cleanTitle) return { data: null, error: new Error('Milestone title cannot be empty.') }
    updates.title = cleanTitle
  }
  if (description !== undefined) updates.description = description?.trim() || null
  if (position !== undefined) updates.position = Number(position) || 1
  if (targetDate !== undefined) updates.target_date = targetDate || null
  if (status !== undefined) {
    updates.status = status
    if (status === 'completed') {
      updates.completed_at = completedAt || new Date().toISOString()
    } else {
      updates.completed_at = null
    }
  }

  try {
    const { data, error } = await supabase
      .from('learning_milestones')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return { data: null, error }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update milestone.'),
    }
  }
}

/**
 * Delete a milestone.
 */
export async function deleteMilestone({ id, userId }) {
  if (!id || !userId) {
    return { error: new Error('Milestone ID and User ID are required.') }
  }

  try {
    const { error } = await supabase
      .from('learning_milestones')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return { error: error || null }
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete milestone.'),
    }
  }
}

/**
 * Reorder milestones within a plan.
 * @param {Object} params
 * @param {string} params.userId
 * @param {Array<string>} params.milestoneIdsInOrder
 */
export async function reorderMilestones({ userId, milestoneIdsInOrder }) {
  if (!userId || !Array.isArray(milestoneIdsInOrder)) {
    return { error: new Error('Invalid arguments for reorderMilestones.') }
  }

  try {
    const updates = milestoneIdsInOrder.map((id, index) =>
      supabase
        .from('learning_milestones')
        .update({ position: index + 1 })
        .eq('id', id)
        .eq('user_id', userId),
    )

    await Promise.all(updates)
    return { error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to reorder milestones.'),
    }
  }
}

// ---------------------------------------------------------------------------
// Progress Calculation Helpers
// ---------------------------------------------------------------------------

/**
 * Computes real task-driven and milestone-driven progress for a plan.
 *
 * @param {Object} plan - The learning plan object
 * @param {Array} milestones - Milestones belonging to this plan
 * @param {Array} tasks - Tasks belonging to this plan (or all user tasks)
 * @returns {{ percentage: number, completedTasksCount: number, totalTasksCount: number, completedMilestonesCount: number, totalMilestonesCount: number, nextMilestone: Object|null }}
 */
export function calculatePlanProgress(plan, milestones = [], tasks = []) {
  if (!plan) {
    return {
      percentage: 0,
      completedTasksCount: 0,
      totalTasksCount: 0,
      completedMilestonesCount: 0,
      totalMilestonesCount: 0,
      nextMilestone: null,
    }
  }

  const planMilestones = milestones.filter((m) => m.plan_id === plan.id)
  const planTasks = tasks.filter((t) => t.plan_id === plan.id)

  const totalMilestonesCount = planMilestones.length
  const completedMilestonesCount = planMilestones.filter((m) => m.status === 'completed').length

  const totalTasksCount = planTasks.length
  const completedTasksCount = planTasks.filter((t) => t.status === 'completed').length

  // Find next incomplete milestone (sorted by position)
  const sortedMilestones = [...planMilestones].sort((a, b) => a.position - b.position)
  const nextMilestone = sortedMilestones.find((m) => m.status !== 'completed') || null

  // If there are linked tasks, task completion drives the percentage
  if (totalTasksCount > 0) {
    const percentage = Math.round((completedTasksCount / totalTasksCount) * 100)
    return {
      percentage,
      completedTasksCount,
      totalTasksCount,
      completedMilestonesCount,
      totalMilestonesCount,
      nextMilestone,
    }
  }

  // If there are no tasks but milestones exist, milestone status drives percentage
  if (totalMilestonesCount > 0) {
    const percentage = Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
    return {
      percentage,
      completedTasksCount: 0,
      totalTasksCount: 0,
      completedMilestonesCount,
      totalMilestonesCount,
      nextMilestone,
    }
  }

  // If 0 milestones and 0 tasks, return honest 0% (unless explicitly marked completed)
  return {
    percentage: plan.status === 'completed' ? 100 : 0,
    completedTasksCount: 0,
    totalTasksCount: 0,
    completedMilestonesCount: 0,
    totalMilestonesCount: 0,
    nextMilestone: null,
  }
}

/**
 * Computes progress for a single milestone.
 *
 * @param {Object} milestone
 * @param {Array} tasks - Tasks linked to this milestone
 * @returns {{ percentage: number, completedCount: number, totalCount: number }}
 */
export function calculateMilestoneProgress(milestone, tasks = []) {
  if (!milestone) return { percentage: 0, completedCount: 0, totalCount: 0 }

  const linkedTasks = tasks.filter((t) => t.milestone_id === milestone.id)
  const totalCount = linkedTasks.length
  const completedCount = linkedTasks.filter((t) => t.status === 'completed').length

  if (totalCount > 0) {
    return {
      percentage: Math.round((completedCount / totalCount) * 100),
      completedCount,
      totalCount,
    }
  }

  return {
    percentage: milestone.status === 'completed' ? 100 : 0,
    completedCount: 0,
    totalCount: 0,
  }
}
