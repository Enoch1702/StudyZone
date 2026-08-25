import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'

/**
 * Searches across the user's workspace (Subjects, Tasks, Deadlines, Learning Plans, Milestones).
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID (strictly enforced)
 * @param {string} params.query - Search query string
 * @param {number} [params.limitPerCategory=5] - Maximum items to return per category
 * @returns {Promise<{ resultsByCategory: Record<string, Array>, totalResults: number, error: any }>}
 */
export async function searchWorkspace({ userId, query, limitPerCategory = 5 }) {
  if (!userId) {
    return { resultsByCategory: {}, totalResults: 0, error: new Error('User is not authenticated.') }
  }

  const normalizedQuery = (query || '').trim().toLowerCase()
  if (!normalizedQuery) {
    return { resultsByCategory: {}, totalResults: 0, error: null }
  }

  try {
    // Execute parallel scoped queries to Supabase
    const [
      subjectsRes,
      tasksRes,
      deadlinesRes,
      plansRes,
      milestonesRes,
    ] = await Promise.all([
      supabase
        .from('subjects')
        .select('id, name, description, color')
        .eq('user_id', userId),

      supabase
        .from('tasks')
        .select('id, title, description, priority, status, due_date, subject_id, plan_id, milestone_id')
        .eq('user_id', userId)
        .neq('status', 'archived'),

      supabase
        .from('deadlines')
        .select('id, title, description, deadline_type, due_date, subject_id')
        .eq('user_id', userId),

      supabase
        .from('learning_plans')
        .select('id, title, description, status, target_date')
        .eq('user_id', userId),

      supabase
        .from('learning_milestones')
        .select('id, plan_id, title, description, position, status, target_date')
        .eq('user_id', userId),
    ])

    const subjects = subjectsRes.data || []
    const tasks = tasksRes.data || []
    const deadlines = deadlinesRes.data || []
    const plans = plansRes.data || []
    const milestones = milestonesRes.data || []

    // Build lookup maps for cross-referencing
    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))
    const planMap = new Map(plans.map((p) => [p.id, p.title]))

    const resultsByCategory = {}
    let totalResults = 0

    // 1. Filter Subjects
    const matchedSubjects = subjects
      .filter((s) => {
        const name = s.name.toLowerCase()
        const desc = (s.description || '').toLowerCase()
        return name.includes(normalizedQuery) || desc.includes(normalizedQuery)
      })
      .slice(0, limitPerCategory)
      .map((s) => ({
        id: `subject-${s.id}`,
        rawId: s.id,
        type: 'subject',
        category: 'Subjects',
        title: s.name,
        subtitle: s.description || 'Subject / Learning Area',
        route: '/subjects',
        color: s.color,
        metadata: { color: s.color },
      }))

    if (matchedSubjects.length > 0) {
      resultsByCategory['Subjects'] = matchedSubjects
      totalResults += matchedSubjects.length
    }

    // 2. Filter Tasks
    const matchedTasks = tasks
      .filter((t) => {
        const title = t.title.toLowerCase()
        const desc = (t.description || '').toLowerCase()
        const subName = (subjectMap.get(t.subject_id) || '').toLowerCase()
        const priority = t.priority.toLowerCase()
        return (
          title.includes(normalizedQuery) ||
          desc.includes(normalizedQuery) ||
          subName.includes(normalizedQuery) ||
          priority.includes(normalizedQuery)
        )
      })
      .slice(0, limitPerCategory)
      .map((t) => {
        const sub = subjectMap.get(t.subject_id)
        const due = t.due_date ? `Due ${formatDate(t.due_date)}` : null
        const parts = [
          t.priority ? `${t.priority.toUpperCase()} priority` : null,
          sub,
          t.status === 'completed' ? 'Completed' : due,
        ].filter(Boolean)

        return {
          id: `task-${t.id}`,
          rawId: t.id,
          type: 'task',
          category: 'Tasks',
          title: t.title,
          subtitle: parts.join(' · '),
          route: '/tasks',
          metadata: {
            priority: t.priority,
            status: t.status,
            subject: sub,
            dueDate: t.due_date,
          },
        }
      })

    if (matchedTasks.length > 0) {
      resultsByCategory['Tasks'] = matchedTasks
      totalResults += matchedTasks.length
    }

    // 3. Filter Deadlines
    const matchedDeadlines = deadlines
      .filter((d) => {
        const title = d.title.toLowerCase()
        const desc = (d.description || '').toLowerCase()
        const type = (d.deadline_type || '').toLowerCase()
        const subName = (subjectMap.get(d.subject_id) || '').toLowerCase()
        return (
          title.includes(normalizedQuery) ||
          desc.includes(normalizedQuery) ||
          type.includes(normalizedQuery) ||
          subName.includes(normalizedQuery)
        )
      })
      .slice(0, limitPerCategory)
      .map((d) => {
        const sub = subjectMap.get(d.subject_id)
        const due = d.due_date ? formatDate(d.due_date) : null
        const parts = [
          d.deadline_type ? d.deadline_type.toUpperCase() : 'DEADLINE',
          sub,
          due ? `Target: ${due}` : null,
        ].filter(Boolean)

        return {
          id: `deadline-${d.id}`,
          rawId: d.id,
          type: 'deadline',
          category: 'Deadlines',
          title: d.title,
          subtitle: parts.join(' · '),
          route: '/deadlines',
          metadata: {
            deadlineType: d.deadline_type,
            subject: sub,
            dueDate: d.due_date,
          },
        }
      })

    if (matchedDeadlines.length > 0) {
      resultsByCategory['Deadlines'] = matchedDeadlines
      totalResults += matchedDeadlines.length
    }

    // 4. Filter Learning Plans
    const matchedPlans = plans
      .filter((p) => {
        const title = p.title.toLowerCase()
        const desc = (p.description || '').toLowerCase()
        const status = (p.status || '').toLowerCase()
        return title.includes(normalizedQuery) || desc.includes(normalizedQuery) || status.includes(normalizedQuery)
      })
      .slice(0, limitPerCategory)
      .map((p) => {
        const target = p.target_date ? `Target: ${formatDate(p.target_date)}` : null
        const parts = [
          p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Active',
          target,
        ].filter(Boolean)

        return {
          id: `plan-${p.id}`,
          rawId: p.id,
          type: 'plan',
          category: 'Learning Plans',
          title: p.title,
          subtitle: parts.join(' · ') || (p.description ? p.description.slice(0, 60) : 'Learning Roadmap'),
          route: `/plans/${p.id}`,
          metadata: {
            status: p.status,
            targetDate: p.target_date,
          },
        }
      })

    if (matchedPlans.length > 0) {
      resultsByCategory['Learning Plans'] = matchedPlans
      totalResults += matchedPlans.length
    }

    // 5. Filter Learning Milestones
    const matchedMilestones = milestones
      .filter((m) => {
        const title = m.title.toLowerCase()
        const desc = (m.description || '').toLowerCase()
        const parentTitle = (planMap.get(m.plan_id) || '').toLowerCase()
        return (
          title.includes(normalizedQuery) ||
          desc.includes(normalizedQuery) ||
          parentTitle.includes(normalizedQuery)
        )
      })
      .slice(0, limitPerCategory)
      .map((m) => {
        const parentTitle = planMap.get(m.plan_id) || 'Learning Plan'
        const parts = [
          `Plan: ${parentTitle}`,
          m.position ? `Milestone #${m.position}` : null,
          m.status === 'completed' ? 'Completed' : (m.target_date ? `Due ${formatDate(m.target_date)}` : null),
        ].filter(Boolean)

        return {
          id: `milestone-${m.id}`,
          rawId: m.id,
          type: 'milestone',
          category: 'Milestones',
          title: m.title,
          subtitle: parts.join(' · '),
          route: `/plans/${m.plan_id}`,
          metadata: {
            planId: m.plan_id,
            planTitle: parentTitle,
            position: m.position,
            status: m.status,
          },
        }
      })

    if (matchedMilestones.length > 0) {
      resultsByCategory['Milestones'] = matchedMilestones
      totalResults += matchedMilestones.length
    }

    return { resultsByCategory, totalResults, error: null }
  } catch (err) {
    console.error('Error executing workspace search:', err)
    return { resultsByCategory: {}, totalResults: 0, error: err }
  }
}
