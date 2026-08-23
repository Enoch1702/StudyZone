import { supabase } from '../lib/supabase'

/**
 * Fetches all dashboard data in a minimal number of Supabase queries:
 *  1. tasks (all) — for stats, today's focus, upcoming
 *  2. deadlines (upcoming) — for the deadlines list
 *  3. study_sessions (current week) — for the weekly activity chart
 *  4. subjects — for subject name resolution
 *
 * All queries are fired in parallel via Promise.all.
 *
 * @param {string} userId - Authenticated user UUID
 * @param {string} weekStart - ISO string for start of current local week (Mon 00:00:00)
 * @param {string} weekEnd - ISO string for end of current local week (Sun 23:59:59)
 * @returns {Promise<{ tasks, deadlines, sessions, subjects, error }>}
 */
export async function fetchDashboardData(userId, weekStart, weekEnd) {
  if (!userId) {
    return { tasks: [], deadlines: [], sessions: [], subjects: [], error: 'No user' }
  }

  try {
    const [tasksRes, deadlinesRes, sessionsRes, subjectsRes, plansRes, milestonesRes] =
      await Promise.all([
      // All user tasks (non-archived) — we compute derived stats client-side
      supabase
        .from('tasks')
        .select('id, title, priority, status, due_date, subject_id, completed_at')
        .eq('user_id', userId)
        .neq('status', 'archived')
        .order('due_date', { ascending: true, nullsFirst: false }),

      // Deadlines from today onwards, sorted by due_date
      supabase
        .from('deadlines')
        .select('id, title, due_date, deadline_type, subject_id')
        .eq('user_id', userId)
        .order('due_date', { ascending: true })
        .limit(8),

      // Study sessions for the current ISO week
      supabase
        .from('study_sessions')
        .select('id, started_at, duration_minutes')
        .eq('user_id', userId)
        .gte('started_at', weekStart)
        .lte('started_at', weekEnd),

      // Subjects — for name resolution in task/deadline displays
      supabase
        .from('subjects')
        .select('id, name, color')
        .eq('user_id', userId)
        .order('name', { ascending: true }),

      // Active learning plans
      supabase
        .from('learning_plans')
        .select('id, title, description, status, target_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Milestones
      supabase
        .from('learning_milestones')
        .select('id, plan_id, title, status, position')
        .eq('user_id', userId)
        .order('position', { ascending: true }),
    ])

    const error =
      tasksRes.error || deadlinesRes.error || sessionsRes.error || subjectsRes.error || null

    return {
      tasks: tasksRes.data || [],
      deadlines: deadlinesRes.data || [],
      sessions: sessionsRes.data || [],
      subjects: subjectsRes.data || [],
      plans: plansRes?.data || [],
      milestones: milestonesRes?.data || [],
      error,
    }
  } catch (err) {
    return {
      tasks: [],
      deadlines: [],
      sessions: [],
      subjects: [],
      plans: [],
      milestones: [],
      error: err instanceof Error ? err : new Error('Failed to load dashboard data.'),
    }
  }
}

/**
 * Derive stats from task array (already filtered to exclude archived).
 * @param {Array} tasks
 * @returns {{ totalTasks, completedTasks, upcomingCount, overallProgress }}
 */
export function computeTaskStats(tasks) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length

  const overallProgress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  // "Upcoming" = incomplete tasks with a future due_date within the next 7 days
  const now = new Date()
  const sevenDaysLater = new Date(now)
  sevenDaysLater.setDate(now.getDate() + 7)
  sevenDaysLater.setHours(23, 59, 59, 999)

  const upcomingCount = tasks.filter((t) => {
    if (t.status === 'completed') return false
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d >= now && d <= sevenDaysLater
  }).length

  return { totalTasks, completedTasks, upcomingCount, overallProgress }
}

/**
 * Pick tasks to show in "Today's Focus":
 * - Incomplete tasks due today or overdue (up to 5), sorted soonest first
 * - If none, take the next 3 upcoming incomplete tasks
 * @param {Array} tasks
 * @returns {Array}
 */
export function computeFocusTasks(tasks) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const incomplete = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived')

  // Overdue or due today
  const todayOrOverdue = incomplete
    .filter((t) => t.due_date && new Date(t.due_date) <= todayEnd)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  if (todayOrOverdue.length > 0) return todayOrOverdue

  // Fallback: next upcoming
  return incomplete
    .filter((t) => t.due_date && new Date(t.due_date) > todayEnd)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3)
}

/**
 * Build a 7-element weekly activity array (Mon–Sun) from study sessions.
 * Sessions are placed on their local calendar day.
 * Days with no sessions get 0 hours.
 *
 * @param {Array} sessions - from study_sessions, each with started_at + duration_minutes
 * @param {Date} weekMondayLocal - local Monday 00:00:00 of the current week
 * @returns {Array<{ day: string, hours: number }>}
 */
export function computeWeeklyActivity(sessions) {
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Build map: day index (0=Mon … 6=Sun) → total hours
  const minutesByDay = [0, 0, 0, 0, 0, 0, 0]

  for (const session of sessions) {
    const localDate = new Date(session.started_at)
    // getDay() → 0=Sun, 1=Mon … 6=Sat; convert to Mon-based index
    const jsDay = localDate.getDay() // 0=Sun
    const monBasedIndex = jsDay === 0 ? 6 : jsDay - 1 // 0=Mon … 6=Sun
    minutesByDay[monBasedIndex] += session.duration_minutes || 0
  }

  return DAY_LABELS.map((day, i) => ({
    day,
    hours: Math.round((minutesByDay[i] / 60) * 10) / 10, // 1 decimal
  }))
}

/**
 * Get the Monday 00:00:00 of the current local week.
 * @returns {Date}
 */
export function getWeekMondayLocal() {
  const now = new Date()
  const jsDay = now.getDay() // 0=Sun, 1=Mon…
  const daysFromMon = jsDay === 0 ? 6 : jsDay - 1
  const mon = new Date(now)
  mon.setDate(now.getDate() - daysFromMon)
  mon.setHours(0, 0, 0, 0)
  return mon
}

/**
 * Get the Sunday 23:59:59.999 of the current local week.
 * @param {Date} weekMondayLocal
 * @returns {Date}
 */
export function getWeekSundayLocal(weekMondayLocal) {
  const sun = new Date(weekMondayLocal)
  sun.setDate(weekMondayLocal.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return sun
}
