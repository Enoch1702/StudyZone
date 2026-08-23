import { supabase } from '../lib/supabase'

/**
 * Updates a user's learner profile preferences and onboarding completion status.
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user UUID
 * @param {string|null} [params.learnerType] - Learner category (e.g. 'placement', 'college')
 * @param {string|null} [params.primaryGoal] - Primary objective key (e.g. 'placements', 'exams')
 * @param {string|null} [params.learningFocus] - Specific topic/skill focus (e.g. 'Java & DSA')
 * @param {boolean} [params.onboardingCompleted=true] - Flag indicating onboarding completed
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function updateLearnerProfile({
  userId,
  learnerType,
  primaryGoal,
  learningFocus,
  onboardingCompleted = true,
}) {
  if (!userId) {
    return { data: null, error: { message: 'User ID is required to update learner profile.' } }
  }

  try {
    const updates = {
      updated_at: new Date().toISOString(),
      onboarding_completed: Boolean(onboardingCompleted),
    }

    if (learnerType !== undefined) {
      updates.learner_type = learnerType ? String(learnerType).trim() : null
    }
    if (primaryGoal !== undefined) {
      updates.primary_goal = primaryGoal ? String(primaryGoal).trim() : null
    }
    if (learningFocus !== undefined) {
      updates.learning_focus = learningFocus ? String(learningFocus).trim() : null
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('[StudyZone] Error updating learner profile:', error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('[StudyZone] Unexpected error updating learner profile:', err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'Failed to save learner profile.' },
    }
  }
}

/**
 * Marks onboarding as skipped/completed without saving learner preferences.
 *
 * @param {{ userId: string }} params
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function skipLearnerOnboarding({ userId }) {
  if (!userId) {
    return { data: null, error: { message: 'User ID is required to skip onboarding.' } }
  }

  return updateLearnerProfile({
    userId,
    onboardingCompleted: true,
  })
}
