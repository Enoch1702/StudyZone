/**
 * Universal Learner Configuration & Personalization Helpers.
 * Centralized mappings for learner types, primary goals, badges, and dashboard greetings.
 */

export const LEARNER_TYPES = [
  {
    id: 'college',
    label: 'College / University',
    shortLabel: 'College',
    description: 'Degree coursework, semester subjects, and university exams',
    icon: 'GraduationCap',
  },
  {
    id: 'school',
    label: 'School',
    shortLabel: 'School',
    description: 'Classes, homework, school tests, and board exams',
    icon: 'School',
  },
  {
    id: 'placement',
    label: 'Placement Preparation',
    shortLabel: 'Placements',
    description: 'DSA, aptitude, interview prep, and coding assessments',
    icon: 'Briefcase',
  },
  {
    id: 'competitive_exam',
    label: 'Competitive Exam',
    shortLabel: 'Competitive',
    description: 'UPSC, GATE, NEET, JEE, SSC, Banking, and entrance tests',
    icon: 'Trophy',
  },
  {
    id: 'skill_dev',
    label: 'Skill Development',
    shortLabel: 'Skills',
    description: 'Programming, web dev, cloud, AI, and technical competencies',
    icon: 'Code',
  },
  {
    id: 'self_learning',
    label: 'Self Learning',
    shortLabel: 'Self Learner',
    description: 'Independent study, reading, books, and self-paced exploration',
    icon: 'BookOpen',
  },
]

export const PRIMARY_GOALS = [
  {
    id: 'exams',
    label: 'Prepare for upcoming exams',
    description: 'Master course materials and ace upcoming test dates',
  },
  {
    id: 'placements',
    label: 'Prepare for placements or interviews',
    description: 'Sharpen problem solving, technical skills, and mock tests',
  },
  {
    id: 'skills',
    label: 'Build technical or professional skills',
    description: 'Learn tools, frameworks, and practical project skills',
  },
  {
    id: 'competitive_exam',
    label: 'Prepare for a competitive exam',
    description: 'Cover high-yield syllabus topics and practice consistently',
  },
  {
    id: 'consistency',
    label: 'Stay consistent with studying',
    description: 'Build daily study habits and track focused learning hours',
  },
  {
    id: 'course_cert',
    label: 'Complete a course or certification',
    description: 'Follow milestones to earn a degree or professional certificate',
  },
  {
    id: 'learn_new',
    label: 'Learn something new',
    description: 'Explore personal interests and expand your knowledge',
  },
]

/**
 * Returns a human-friendly label for a given learner type key.
 * @param {string|null|undefined} learnerTypeId
 * @returns {string}
 */
export function getLearnerTypeLabel(learnerTypeId) {
  if (!learnerTypeId) return 'Learner'
  const match = LEARNER_TYPES.find((t) => t.id === learnerTypeId)
  return match ? match.label : 'Learner'
}

/**
 * Returns a short badge label for headers / cards.
 * @param {string|null|undefined} learnerTypeId
 * @returns {string}
 */
export function getLearnerTypeShortLabel(learnerTypeId) {
  if (!learnerTypeId) return 'Learner'
  const match = LEARNER_TYPES.find((t) => t.id === learnerTypeId)
  return match ? match.shortLabel : 'Learner'
}

/**
 * Returns full metadata for a learner type.
 * @param {string|null|undefined} learnerTypeId
 */
export function getLearnerTypeInfo(learnerTypeId) {
  return LEARNER_TYPES.find((t) => t.id === learnerTypeId) || null
}

/**
 * Returns a human-friendly label for a primary goal key.
 * @param {string|null|undefined} goalId
 * @returns {string}
 */
export function getPrimaryGoalLabel(goalId) {
  if (!goalId) return ''
  const match = PRIMARY_GOALS.find((g) => g.id === goalId)
  return match ? match.label : ''
}

/**
 * Returns personalized dashboard subtitle copy based on learner profile.
 * Employs a robust universal fallback if fields are missing or empty.
 *
 * @param {string|null|undefined} learnerType
 * @param {string|null|undefined} primaryGoal
 * @param {string|null|undefined} learningFocus
 * @returns {string}
 */
export function getPersonalizedGreeting(learnerType, primaryGoal, learningFocus) {
  // Focus-aware overrides if specific focus topic was provided
  if (learningFocus && learningFocus.trim()) {
    const cleanFocus = learningFocus.trim()
    switch (learnerType) {
      case 'placement':
        return `Focusing on ${cleanFocus} for your placement goals.`
      case 'skill_dev':
        return `Building momentum in ${cleanFocus}.`
      case 'competitive_exam':
        return `Targeted preparation for ${cleanFocus}.`
      case 'college':
      case 'school':
        return `Staying on top of ${cleanFocus} and your coursework.`
      default:
        return `Making steady progress in ${cleanFocus}.`
    }
  }

  // Learner-type specific messages
  switch (learnerType) {
    case 'placement':
      return "Let's make progress toward your placement and interview goals."
    case 'competitive_exam':
      return 'Stay consistent — small daily study sessions compound into top rank results.'
    case 'skill_dev':
      return 'Keep building your skills, one focused session at a time.'
    case 'college':
      return "Let's organize your coursework and stay ahead of upcoming deadlines."
    case 'school':
      return 'Keep your subjects organized and build great daily study habits.'
    case 'self_learning':
      return "Keep moving forward with what you're learning today."
    default:
      // Primary goal fallback
      if (primaryGoal === 'exams') {
        return "Let's stay ahead of your upcoming exam schedule."
      }
      if (primaryGoal === 'placements') {
        return "Let's prepare for your next technical interview milestone."
      }
      if (primaryGoal === 'consistency') {
        return 'Build your study streak with a focused session today.'
      }
      // Universal fallback
      return 'Plan your learning, organize your tasks, and track your daily progress.'
  }
}
