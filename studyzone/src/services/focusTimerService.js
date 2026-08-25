import { createStudySession } from './studySessionsService'
import { supabase } from '../lib/supabase'

export const FOCUS_PRESETS = [
  {
    id: 'pomodoro',
    name: 'Classic Pomodoro',
    description: '25m Focus · 5m Break · 15m Long Break every 4 cycles',
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  },
  {
    id: 'deep_work',
    name: 'Deep Work',
    description: '50m Focus · 10m Break · Sustained concentration',
    focusMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    cyclesBeforeLongBreak: 2,
  },
  {
    id: 'extended',
    name: 'Extended Focus',
    description: '90m Focus · 20m Break · Flow state mastery',
    focusMinutes: 90,
    shortBreakMinutes: 20,
    longBreakMinutes: 30,
    cyclesBeforeLongBreak: 2,
  },
  {
    id: 'quick',
    name: 'Quick Focus',
    description: '15m Focus · 5m Break · Rapid momentum builder',
    focusMinutes: 15,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  },
  {
    id: 'custom',
    name: 'Custom Mode',
    description: 'User-defined focus and break intervals',
    focusMinutes: 30,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  },
]

const STORAGE_KEY = 'studyzone_active_focus_session'

/**
 * Saves running or paused focus session state to localStorage.
 */
export function saveActiveFocusState(state) {
  try {
    if (!state) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  } catch {
    // ignore
  }
}

/**
 * Loads active focus session state and calculates real remaining seconds from timestamps.
 */
export function loadActiveFocusState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.modeId) return null

    // If session was actively running, calculate actual elapsed time
    if (parsed.isRunning && !parsed.isPaused && parsed.targetEndTime) {
      const remaining = Math.max(0, Math.round((parsed.targetEndTime - Date.now()) / 1000))
      parsed.remainingSeconds = remaining
    }

    return parsed
  } catch {
    return null
  }
}

/**
 * Logs a completed or early-ended focus session into public.study_sessions.
 * ONLY logs actual focused minutes (never break or paused time).
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string|null} [params.subjectId]
 * @param {string|null} [params.taskId]
 * @param {number} params.focusedMinutes - Whole positive number of minutes focused
 * @param {string} params.presetName - e.g. "Classic Pomodoro"
 * @param {number} params.intendedMinutes - Intended duration in minutes
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function logCompletedFocusSession({
  userId,
  subjectId,
  taskId,
  focusedMinutes,
  presetName,
  intendedMinutes,
}) {
  if (!userId) {
    return { data: null, error: new Error('User is not authenticated.') }
  }

  const mins = Math.max(1, Math.round(focusedMinutes))
  const notes = `Focus Session: ${presetName || 'Focus Mode'} (${mins}m focused of ${intendedMinutes || mins}m target)`

  return createStudySession({
    userId,
    subjectId: subjectId || null,
    taskId: taskId || null,
    durationMinutes: mins,
    notes,
  })
}

/**
 * Fetches recent focus sessions and calculates today & weekly summary stats.
 */
export async function getFocusSessionStats(userId) {
  if (!userId) {
    return {
      todayFocusMinutes: 0,
      todaySessionsCount: 0,
      weeklyFocusMinutes: 0,
      weeklyAvgDurationMinutes: 0,
      recentSessions: [],
      error: null,
    }
  }

  try {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('id, subject_id, task_id, started_at, duration_minutes, notes')
      .eq('user_id', userId)
      .gte('started_at', sevenDaysAgo)
      .order('started_at', { ascending: false })

    if (error) {
      return {
        todayFocusMinutes: 0,
        todaySessionsCount: 0,
        weeklyFocusMinutes: 0,
        weeklyAvgDurationMinutes: 0,
        recentSessions: [],
        error,
      }
    }

    const allSessions = sessions || []

    // Filter today's sessions
    const todaySessions = allSessions.filter(
      (s) => s.started_at && s.started_at.slice(0, 10) === todayStr,
    )
    const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    const todaySessionsCount = todaySessions.length

    // Weekly focus
    const weeklyFocusMinutes = allSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
    const weeklyAvgDurationMinutes =
      allSessions.length > 0 ? Math.round(weeklyFocusMinutes / allSessions.length) : 0

    return {
      todayFocusMinutes,
      todaySessionsCount,
      weeklyFocusMinutes,
      weeklyAvgDurationMinutes,
      recentSessions: allSessions.slice(0, 10),
      error: null,
    }
  } catch (err) {
    console.error('Error fetching focus session stats:', err)
    return {
      todayFocusMinutes: 0,
      todaySessionsCount: 0,
      weeklyFocusMinutes: 0,
      weeklyAvgDurationMinutes: 0,
      recentSessions: [],
      error: err,
    }
  }
}
