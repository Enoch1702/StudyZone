/**
 * Universal Learner Configuration & Personalization Helpers.
 * Centralized mappings for learner types, primary goals, badges, and dashboard greetings.
 */

export const LEARNER_TYPES = []
export const PRIMARY_GOALS = []

/**
 * Returns a clean, universal label.
 * @param {string|null|undefined} _learnerTypeId
 * @returns {string}
 */
export function getLearnerTypeLabel() {
  return 'Learner'
}

/**
 * Returns empty badge label to remove role badges.
 * @returns {string}
 */
export function getLearnerTypeShortLabel() {
  return ''
}

/**
 * Returns full metadata for a learner type (null for universal learning).
 */
export function getLearnerTypeInfo() {
  return null
}

/**
 * Returns a human-friendly label for a primary goal key.
 * @returns {string}
 */
export function getPrimaryGoalLabel() {
  return ''
}

/**
 * Returns universal, contextual dashboard subtitle copy without role assumptions.
 *
 * @param {string|null|undefined} learnerType
 * @param {string|null|undefined} primaryGoal
 * @param {string|null|undefined} learningFocus
 * @returns {string}
 */
export function getPersonalizedGreeting(learnerType, primaryGoal, learningFocus) {
  const focus = learningFocus || primaryGoal || learnerType
  if (focus && typeof focus === 'string' && focus.trim()) {
    return `Making steady progress in ${focus.trim()}.`
  }
  return 'Ready to continue where you left off?'
}

