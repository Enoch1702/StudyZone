import { supabase } from '../lib/supabase'

/**
 * Service providing pure deterministic calculations and parallel data fetching
 * for StudyZone Learning Analytics & Consistency Tracking (Phase 8A).
 *
 * ALL calculations are 100% mathematical and traceable to actual Supabase records.
 * No AI APIs, no fake data, no invented trends.
 */

// ---------------------------------------------------------------------------
// Timezone-Safe Local Calendar Date Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a Date object or ISO string into a local calendar string 'YYYY-MM-DD'.
 * Uses local year, month, and date (not UTC) to accurately reflect the user's local day.
 *
 * @param {Date|string|number} d
 * @returns {string} 'YYYY-MM-DD'
 */
export function toLocalDateString(d) {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generates an array of local calendar date strings for the last N days ending today.
 * e.g., if N=7 and today is 2026-08-24, returns [2026-08-18, ..., 2026-08-24].
 *
 * @param {number} n - Number of days
 * @returns {Array<string>} Array of 'YYYY-MM-DD' strings in chronological order
 */
export function getLastNDays(n = 7) {
  const dates = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(toLocalDateString(d))
  }
  return dates
}

/**
 * Generates an array of local calendar date strings for the next N days starting today.
 * e.g., if N=7 and today is 2026-08-24, returns [2026-08-24, ..., 2026-08-30].
 *
 * @param {number} n - Number of days
 * @returns {Array<string>} Array of 'YYYY-MM-DD' strings in chronological order
 */
export function getNextNDays(n = 7) {
  const dates = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(toLocalDateString(d))
  }
  return dates
}

/**
 * Converts total minutes into human-readable format e.g. "2h 30m" or "45m".
 *
 * @param {number} minutes
 * @returns {string}
 */
export function formatMinutes(minutes = 0) {
  const total = Math.max(0, Math.round(Number(minutes) || 0))
  if (total === 0) return '0m'
  const hours = Math.floor(total / 60)
  const remainingMins = total % 60

  if (hours > 0 && remainingMins > 0) {
    return `${hours}h ${remainingMins}m`
  }
  if (hours > 0) {
    return `${hours}h`
  }
  return `${remainingMins}m`
}

// ---------------------------------------------------------------------------
// 1. Data Hub (Parallel Fetching)
// ---------------------------------------------------------------------------

/**
 * Fetches all necessary data for the analytics hub in parallel queries.
 * Scoped strictly to the authenticated user via Supabase RLS.
 *
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ sessions: Array, tasks: Array, deadlines: Array, subjects: Array, error: Error|null }>}
 */
export async function fetchLearningAnalyticsData(userId) {
  if (!userId) {
    return { sessions: [], tasks: [], deadlines: [], subjects: [], error: new Error('User ID required') }
  }

  try {
    const [sessionsRes, tasksRes, deadlinesRes, subjectsRes] = await Promise.all([
      // 1. All user study sessions (needed for streak calculation across all time and 30-day analytics)
      supabase
        .from('study_sessions')
        .select('id, started_at, duration_minutes, subject_id, notes')
        .eq('user_id', userId)
        .order('started_at', { ascending: false }),

      // 2. All user tasks (non-archived)
      supabase
        .from('tasks')
        .select('id, title, priority, status, due_date, subject_id, completed_at, created_at, plan_id, milestone_id')
        .eq('user_id', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false }),

      // 3. User deadlines
      supabase
        .from('deadlines')
        .select('id, title, due_date, deadline_type, subject_id')
        .eq('user_id', userId)
        .order('due_date', { ascending: true }),

      // 4. User subjects
      supabase
        .from('subjects')
        .select('id, name, color')
        .eq('user_id', userId)
        .order('name', { ascending: true }),
    ])

    const error =
      sessionsRes.error || tasksRes.error || deadlinesRes.error || subjectsRes.error || null

    return {
      sessions: sessionsRes.data || [],
      tasks: tasksRes.data || [],
      deadlines: deadlinesRes.data || [],
      subjects: subjectsRes.data || [],
      error,
    }
  } catch (err) {
    return {
      sessions: [],
      tasks: [],
      deadlines: [],
      subjects: [],
      error: err instanceof Error ? err : new Error('Failed to load learning analytics data.'),
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Study Consistency & Streak Calculations
// ---------------------------------------------------------------------------

/**
 * Calculates study streaks and consistency metrics from study sessions.
 *
 * Rules:
 * - A "study day" is a local calendar day with >= 1 recorded session.
 * - Current streak: Consecutive study days ending TODAY.
 *   If user did NOT study today, current streak is 0 (yesterday's streak is not carried over).
 * - Longest streak: Max consecutive sequence of study days in user's history.
 * - Active days (last 7 days): count of study days in [today-6, today].
 * - Active days (last 30 days): count of study days in [today-29, today].
 *
 * @param {Array} sessions - Array of study session objects
 * @returns {{ currentStreak: number, longestStreak: number, activeDays7d: number, activeDays30d: number, sevenDayCalendar: Array }}
 */
export function calculateStudyConsistency(sessions = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    const default7Days = getLastNDays(7).map((dateStr) => {
      const d = new Date(dateStr + 'T00:00:00')
      return {
        dateStr,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isStudied: false,
        durationMinutes: 0,
        isToday: dateStr === toLocalDateString(new Date()),
      }
    })

    return {
      currentStreak: 0,
      longestStreak: 0,
      activeDays7d: 0,
      activeDays30d: 0,
      sevenDayCalendar: default7Days,
    }
  }

  // 1. Group sessions by local calendar date (YYYY-MM-DD)
  const studyDayMinutesMap = new Map() // dateStr -> total minutes

  for (const session of sessions) {
    if (!session?.started_at) continue
    const dateStr = toLocalDateString(session.started_at)
    if (!dateStr) continue

    const currentMinutes = studyDayMinutesMap.get(dateStr) || 0
    studyDayMinutesMap.set(dateStr, currentMinutes + (Number(session.duration_minutes) || 0))
  }

  const uniqueStudyDates = Array.from(studyDayMinutesMap.keys()).sort() // ascending 'YYYY-MM-DD'
  const studyDatesSet = new Set(uniqueStudyDates)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toLocalDateString(today)

  // 2. Current Streak Calculation
  // Must end TODAY. If no session today, streak is 0.
  let currentStreak = 0
  if (studyDatesSet.has(todayStr)) {
    let checkDate = new Date(today)
    while (true) {
      const checkStr = toLocalDateString(checkDate)
      if (studyDatesSet.has(checkStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // 3. Longest Streak Calculation (Historical across all unique dates)
  let longestStreak = 0
  let currentRun = 0
  let prevDateObj = null

  for (const dateStr of uniqueStudyDates) {
    const parts = dateStr.split('-').map(Number)
    const currentDateObj = new Date(parts[0], parts[1] - 1, parts[2])
    currentDateObj.setHours(0, 0, 0, 0)

    if (!prevDateObj) {
      currentRun = 1
    } else {
      const diffDays = Math.round((currentDateObj - prevDateObj) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        currentRun++
      } else {
        currentRun = 1
      }
    }

    if (currentRun > longestStreak) {
      longestStreak = currentRun
    }
    prevDateObj = currentDateObj
  }

  // 4. Active Days in Last 7 and 30 Days
  const last7DaysList = getLastNDays(7)
  const last30DaysList = getLastNDays(30)

  let activeDays7d = 0
  for (const dStr of last7DaysList) {
    if (studyDatesSet.has(dStr)) activeDays7d++
  }

  let activeDays30d = 0
  for (const dStr of last30DaysList) {
    if (studyDatesSet.has(dStr)) activeDays30d++
  }

  // 5. Build 7-Day Consistency Calendar Structure
  const sevenDayCalendar = last7DaysList.map((dateStr) => {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    const isStudied = studyDatesSet.has(dateStr)
    const durationMinutes = studyDayMinutesMap.get(dateStr) || 0

    return {
      dateStr,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isStudied,
      durationMinutes,
      isToday: dateStr === todayStr,
    }
  })

  return {
    currentStreak,
    longestStreak,
    activeDays7d,
    activeDays30d,
    sevenDayCalendar,
  }
}

// ---------------------------------------------------------------------------
// 3. Study Time Analytics
// ---------------------------------------------------------------------------

/**
 * Calculates study time statistics for the last 7 days and 30 days.
 *
 * @param {Array} sessions - Array of study sessions
 * @returns {{ totalMinutes7d: number, averageMinutesPerActiveDay7d: number, mostProductiveDay7d: Object|null, totalMinutes30d: number, averageMinutesPerActiveDay30d: number }}
 */
export function calculateStudyTimeStats(sessions = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      totalMinutes7d: 0,
      averageMinutesPerActiveDay7d: 0,
      mostProductiveDay7d: null,
      totalMinutes30d: 0,
      averageMinutesPerActiveDay30d: 0,
    }
  }

  const last7Set = new Set(getLastNDays(7))
  const last30Set = new Set(getLastNDays(30))

  const dailyMinutes7d = new Map() // dateStr -> minutes
  const dailyMinutes30d = new Map() // dateStr -> minutes

  let totalMinutes7d = 0
  let totalMinutes30d = 0

  for (const session of sessions) {
    if (!session?.started_at) continue
    const dateStr = toLocalDateString(session.started_at)
    if (!dateStr) continue

    const duration = Number(session.duration_minutes) || 0

    if (last7Set.has(dateStr)) {
      totalMinutes7d += duration
      dailyMinutes7d.set(dateStr, (dailyMinutes7d.get(dateStr) || 0) + duration)
    }

    if (last30Set.has(dateStr)) {
      totalMinutes30d += duration
      dailyMinutes30d.set(dateStr, (dailyMinutes30d.get(dateStr) || 0) + duration)
    }
  }

  const activeDays7d = dailyMinutes7d.size
  const averageMinutesPerActiveDay7d =
    activeDays7d > 0 ? Math.round(totalMinutes7d / activeDays7d) : 0

  const activeDays30d = dailyMinutes30d.size
  const averageMinutesPerActiveDay30d =
    activeDays30d > 0 ? Math.round(totalMinutes30d / activeDays30d) : 0

  // Find most productive day in last 7 days
  let mostProductiveDay7d = null
  let maxDayMinutes = 0

  for (const [dateStr, mins] of dailyMinutes7d.entries()) {
    if (mins > maxDayMinutes) {
      maxDayMinutes = mins
      const parts = dateStr.split('-').map(Number)
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      mostProductiveDay7d = {
        dateStr,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'long' }),
        minutes: mins,
      }
    }
  }

  return {
    totalMinutes7d,
    averageMinutesPerActiveDay7d,
    mostProductiveDay7d,
    totalMinutes30d,
    averageMinutesPerActiveDay30d,
  }
}

// ---------------------------------------------------------------------------
// 4. Learning Area Balance (Last 30 Days)
// ---------------------------------------------------------------------------

/**
 * Calculates study time distribution across subjects / learning areas over the last 30 days.
 * Sessions without a subject are classified honestly as "Uncategorized".
 *
 * @param {Array} sessions - Array of study sessions
 * @param {Array} subjects - Array of user subject objects
 * @returns {{ items: Array<{ subjectId: string|null, subjectName: string, color: string, totalMinutes: number, percentageOfStudyTime: number }>, totalStudyMinutes30d: number }}
 */
export function calculateLearningBalance(sessions = [], subjects = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return { items: [], totalStudyMinutes30d: 0 }
  }

  const last30Set = new Set(getLastNDays(30))
  const subjectMap = new Map() // subjectId -> { name, color }

  for (const sub of subjects) {
    if (sub?.id) {
      subjectMap.set(sub.id, {
        name: sub.name || 'Untitled Subject',
        color: sub.color || '#3b82f6',
      })
    }
  }

  const minutesBySubjectId = new Map() // subjectId|'uncategorized' -> totalMinutes
  let totalStudyMinutes30d = 0

  for (const session of sessions) {
    if (!session?.started_at) continue
    const dateStr = toLocalDateString(session.started_at)
    if (!last30Set.has(dateStr)) continue

    const duration = Number(session.duration_minutes) || 0
    if (duration <= 0) continue

    totalStudyMinutes30d += duration

    const subId = session.subject_id && subjectMap.has(session.subject_id) ? session.subject_id : 'uncategorized'
    minutesBySubjectId.set(subId, (minutesBySubjectId.get(subId) || 0) + duration)
  }

  if (totalStudyMinutes30d === 0) {
    return { items: [], totalStudyMinutes30d: 0 }
  }

  const items = []

  for (const [subId, mins] of minutesBySubjectId.entries()) {
    if (mins <= 0) continue

    const percentageOfStudyTime = Math.round((mins / totalStudyMinutes30d) * 100)

    if (subId === 'uncategorized') {
      items.push({
        subjectId: null,
        subjectName: 'Uncategorized',
        color: '#71717a', // neutral slate
        totalMinutes: mins,
        percentageOfStudyTime,
      })
    } else {
      const subInfo = subjectMap.get(subId)
      items.push({
        subjectId: subId,
        subjectName: subInfo.name,
        color: subInfo.color,
        totalMinutes: mins,
        percentageOfStudyTime,
      })
    }
  }

  // Sort descending by totalMinutes
  items.sort((a, b) => b.totalMinutes - a.totalMinutes)

  return { items, totalStudyMinutes30d }
}

// ---------------------------------------------------------------------------
// 5. Neglected Learning Areas Detection
// ---------------------------------------------------------------------------

/**
 * Identifies learning areas that have had no recorded study sessions in the last 14 days,
 * or have never been studied.
 *
 * @param {Array} sessions - Array of study sessions across all time
 * @param {Array} subjects - Array of user subjects
 * @returns {Array<{ subjectId: string, subjectName: string, color: string, daysSinceLastStudy: number|null, lastStudiedDate: string|null }>}
 */
export function calculateNeglectedAreas(sessions = [], subjects = []) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find most recent session date per subject across all time
  const latestSessionDateBySubject = new Map() // subjectId -> Date object

  for (const session of sessions) {
    if (!session?.subject_id || !session?.started_at) continue

    const sDate = new Date(session.started_at)
    sDate.setHours(0, 0, 0, 0)

    const existing = latestSessionDateBySubject.get(session.subject_id)
    if (!existing || sDate > existing) {
      latestSessionDateBySubject.set(session.subject_id, sDate)
    }
  }

  const neglected = []

  for (const sub of subjects) {
    if (!sub?.id) continue

    const lastStudiedDateObj = latestSessionDateBySubject.get(sub.id)

    if (!lastStudiedDateObj) {
      // Never studied
      neglected.push({
        subjectId: sub.id,
        subjectName: sub.name,
        color: sub.color || '#3b82f6',
        daysSinceLastStudy: null,
        lastStudiedDate: null,
      })
    } else {
      const daysDiff = Math.floor((today - lastStudiedDateObj) / (1000 * 60 * 60 * 24))
      if (daysDiff > 14) {
        neglected.push({
          subjectId: sub.id,
          subjectName: sub.name,
          color: sub.color || '#3b82f6',
          daysSinceLastStudy: daysDiff,
          lastStudiedDate: toLocalDateString(lastStudiedDateObj),
        })
      }
    }
  }

  // Sort: "Never studied" (null) first, then by highest daysSinceLastStudy descending
  neglected.sort((a, b) => {
    if (a.daysSinceLastStudy === null && b.daysSinceLastStudy === null) return 0
    if (a.daysSinceLastStudy === null) return -1
    if (b.daysSinceLastStudy === null) return 1
    return b.daysSinceLastStudy - a.daysSinceLastStudy
  })

  return neglected
}

// ---------------------------------------------------------------------------
// 6. Task Completion Analytics (Last 30 Days)
// ---------------------------------------------------------------------------

/**
 * Calculates task completion metrics for the last 30 days.
 * Uses honest mathematical counts and deterministic interpretations without AI.
 *
 * @param {Array} tasks - Array of user tasks (non-archived)
 * @returns {{ tasksCreated: number, tasksCompleted: number, completionRate: number, interpretation: string }}
 */
export function calculateTaskCompletion(tasks = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      tasksCreated: 0,
      tasksCompleted: 0,
      completionRate: 0,
      interpretation: 'No tasks tracked in this period.',
    }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  let tasksCreated = 0
  let tasksCompleted = 0

  for (const task of tasks) {
    if (task.status === 'archived') continue

    // Count tasks created in last 30 days
    const createdDate = task.created_at ? new Date(task.created_at) : null
    const isCreatedInWindow = createdDate && createdDate >= thirtyDaysAgo

    if (isCreatedInWindow) {
      tasksCreated++
    }

    // Count tasks completed in last 30 days
    if (task.status === 'completed') {
      const completedDate = task.completed_at ? new Date(task.completed_at) : createdDate
      if (completedDate && completedDate >= thirtyDaysAgo) {
        tasksCompleted++
      } else if (!task.completed_at && isCreatedInWindow) {
        // Fallback for tasks completed without a timestamp within window
        tasksCompleted++
      }
    }
  }

  // Total relevant tasks denominator
  const relevantTasks = Math.max(tasksCreated, tasksCompleted)

  const completionRate =
    relevantTasks > 0 ? Math.min(100, Math.round((tasksCompleted / relevantTasks) * 100)) : 0

  let interpretation = 'No tasks tracked in the last 30 days.'
  if (relevantTasks > 0) {
    interpretation = `${tasksCompleted} of ${relevantTasks} tracked tasks were completed.`
  }

  return {
    tasksCreated,
    tasksCompleted,
    completionRate,
    interpretation,
  }
}

// ---------------------------------------------------------------------------
// 7. Upcoming Workload Analysis (Next 7 Days)
// ---------------------------------------------------------------------------

/**
 * Analyzes workload for the upcoming 7 days (today through today + 6 days).
 *
 * @param {Array} tasks - Array of non-archived user tasks
 * @param {Array} deadlines - Array of user deadlines
 * @returns {{ upcomingTasksCount: number, upcomingDeadlinesCount: number, highPriorityCount: number, overdueCount: number, busiestDate: string|null, busiestDayLabel: string|null, busiestItemCount: number, dailyWorkload: Array }}
 */
export function calculateUpcomingWorkload(tasks = [], deadlines = []) {
  const next7DaysList = getNextNDays(7)
  const next7DaysSet = new Set(next7DaysList)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toLocalDateString(today)

  let overdueCount = 0
  let highPriorityCount = 0
  let upcomingTasksCount = 0
  let upcomingDeadlinesCount = 0

  const itemsByDate = new Map() // dateStr -> count
  for (const dStr of next7DaysList) {
    itemsByDate.set(dStr, 0)
  }

  // Process incomplete tasks
  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'archived') continue

    const isHighPriority = task.priority === 'high' || task.priority === 'urgent'

    if (!task.due_date) {
      if (isHighPriority) highPriorityCount++
      continue
    }

    const taskDateStr = toLocalDateString(task.due_date)
    const taskDate = new Date(task.due_date)
    taskDate.setHours(0, 0, 0, 0)

    if (taskDate < today) {
      overdueCount++
      if (isHighPriority) highPriorityCount++
    } else if (next7DaysSet.has(taskDateStr)) {
      upcomingTasksCount++
      if (isHighPriority) highPriorityCount++
      itemsByDate.set(taskDateStr, (itemsByDate.get(taskDateStr) || 0) + 1)
    }
  }

  // Process deadlines
  for (const deadline of deadlines) {
    if (!deadline.due_date) continue

    const deadDateStr = toLocalDateString(deadline.due_date)
    const deadDate = new Date(deadline.due_date)
    deadDate.setHours(0, 0, 0, 0)

    if (deadDate < today) {
      // Overdue deadline
      overdueCount++
    } else if (next7DaysSet.has(deadDateStr)) {
      upcomingDeadlinesCount++
      itemsByDate.set(deadDateStr, (itemsByDate.get(deadDateStr) || 0) + 1)
    }
  }

  // Find busiest upcoming date (tie-breaker: earliest date)
  let busiestDate = null
  let busiestDayLabel = null
  let busiestItemCount = 0

  for (const dStr of next7DaysList) {
    const count = itemsByDate.get(dStr) || 0
    if (count > busiestItemCount) {
      busiestItemCount = count
      busiestDate = dStr
      const parts = dStr.split('-').map(Number)
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      busiestDayLabel = dStr === todayStr ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'long' })
    }
  }

  // Build daily breakdown
  const dailyWorkload = next7DaysList.map((dStr) => {
    const parts = dStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    return {
      dateStr: dStr,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      itemCount: itemsByDate.get(dStr) || 0,
      isToday: dStr === todayStr,
    }
  })

  return {
    upcomingTasksCount,
    upcomingDeadlinesCount,
    highPriorityCount,
    overdueCount,
    busiestDate,
    busiestDayLabel,
    busiestItemCount,
    dailyWorkload,
  }
}

// ---------------------------------------------------------------------------
// 8. Deterministic Workload Classification (Phase 8B)
// ---------------------------------------------------------------------------

/**
 * Deterministically classifies workload intensity into:
 * 'Light' | 'Balanced' | 'Busy' | 'Overloaded'
 *
 * Rules:
 * - Overloaded: (overdueCount > 0 AND totalUpcoming >= 4) OR totalUpcoming >= 10 OR highPriorityCount >= 4
 * - Busy: totalUpcoming >= 6 OR highPriorityCount >= 2 OR upcomingDeadlinesCount >= 2 OR overdueCount > 0
 * - Balanced: totalUpcoming >= 2 OR upcomingDeadlinesCount >= 1
 * - Light: totalUpcoming <= 1 AND overdueCount === 0
 *
 * @param {Object} workload - Result from calculateUpcomingWorkload
 * @returns {{ level: 'Light'|'Balanced'|'Busy'|'Overloaded', reasons: string[] }}
 */
export function classifyWorkload(workload = {}) {
  const {
    upcomingTasksCount = 0,
    upcomingDeadlinesCount = 0,
    overdueCount = 0,
    highPriorityCount = 0,
    busiestDayLabel = null,
    busiestItemCount = 0,
  } = workload

  const totalUpcoming = upcomingTasksCount + upcomingDeadlinesCount
  const reasons = []

  if (totalUpcoming > 0) {
    reasons.push(`${totalUpcoming} scheduled item${totalUpcoming !== 1 ? 's' : ''} in next 7 days`)
  }
  if (highPriorityCount > 0) {
    reasons.push(`${highPriorityCount} high-priority task${highPriorityCount !== 1 ? 's' : ''}`)
  }
  if (upcomingDeadlinesCount > 0) {
    reasons.push(`${upcomingDeadlinesCount} upcoming deadline${upcomingDeadlinesCount !== 1 ? 's' : ''}`)
  }
  if (overdueCount > 0) {
    reasons.push(`${overdueCount} overdue item${overdueCount !== 1 ? 's' : ''}`)
  }
  if (busiestDayLabel && busiestItemCount > 0) {
    reasons.push(`${busiestDayLabel} contains the highest concentration of work (${busiestItemCount} items)`)
  }

  let level
  if ((overdueCount > 0 && totalUpcoming >= 4) || totalUpcoming >= 10 || highPriorityCount >= 4) {
    level = 'Overloaded'
  } else if (totalUpcoming >= 6 || highPriorityCount >= 2 || upcomingDeadlinesCount >= 2 || overdueCount > 0) {
    level = 'Busy'
  } else if (totalUpcoming >= 2 || upcomingDeadlinesCount >= 1) {
    level = 'Balanced'
  } else {
    level = 'Light'
  }

  return {
    level,
    reasons,
  }
}

// ---------------------------------------------------------------------------
// 9. Normalized Analytics Context Builder for AI Coach (Phase 8B)
// ---------------------------------------------------------------------------

/**
 * Builds a clean, compact, normalized analytics summary object
 * to provide verified metrics directly to the AI Assistant.
 *
 * @param {Object} params
 * @param {Object} params.consistency
 * @param {Object} params.timeStats
 * @param {Object} params.learningBalance
 * @param {Array} params.neglectedAreas
 * @param {Object} params.taskCompletion
 * @param {Object} params.upcomingWorkload
 * @param {Object} [params.workloadClassification]
 * @returns {Object} normalized summary payload
 */
export function buildAnalyticsSummary({
  consistency,
  timeStats,
  learningBalance,
  neglectedAreas,
  taskCompletion,
  upcomingWorkload,
  workloadClassification,
}) {
  const workloadClass = workloadClassification || classifyWorkload(upcomingWorkload)

  return {
    consistency: {
      current_streak: consistency?.currentStreak ?? 0,
      longest_streak: consistency?.longestStreak ?? 0,
      active_days_7d: consistency?.activeDays7d ?? 0,
      active_days_30d: consistency?.activeDays30d ?? 0,
    },
    study_time: {
      total_minutes_7d: timeStats?.totalMinutes7d ?? 0,
      average_minutes_per_active_day_7d: timeStats?.averageMinutesPerActiveDay7d ?? 0,
      most_productive_day_7d: timeStats?.mostProductiveDay7d?.dayLabel ?? null,
      total_minutes_30d: timeStats?.totalMinutes30d ?? 0,
      average_minutes_per_active_day_30d: timeStats?.averageMinutesPerActiveDay30d ?? 0,
    },
    learning_balance: (learningBalance?.items || []).map((item) => ({
      subject_name: item.subjectName,
      percentage: item.percentageOfStudyTime,
      total_minutes: item.totalMinutes,
    })),
    neglected_areas: (neglectedAreas || []).map((item) => ({
      subject_name: item.subjectName,
      days_since_last_study:
        item.daysSinceLastStudy === null ? 'Never studied' : `${item.daysSinceLastStudy} days ago`,
    })),
    task_progress: {
      tasks_created: taskCompletion?.tasksCreated ?? 0,
      tasks_completed: taskCompletion?.tasksCompleted ?? 0,
      completion_rate: taskCompletion?.completionRate ?? 0,
    },
    upcoming_workload: {
      upcoming_tasks: upcomingWorkload?.upcomingTasksCount ?? 0,
      upcoming_deadlines: upcomingWorkload?.upcomingDeadlinesCount ?? 0,
      overdue_items: upcomingWorkload?.overdueCount ?? 0,
      high_priority_tasks: upcomingWorkload?.highPriorityCount ?? 0,
      busiest_day: upcomingWorkload?.busiestDayLabel ?? null,
      workload_level: workloadClass.level,
      workload_reasons: workloadClass.reasons,
    },
  }
}

