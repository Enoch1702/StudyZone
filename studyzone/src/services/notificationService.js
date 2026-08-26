import { supabase } from '../lib/supabase'

/**
 * Fetches notifications for the authenticated user, ordered newest first.
 */
export async function getNotifications(userId, limit = 25) {
  if (!userId) return { data: [], error: null }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data: data || [], error }
  } catch (err) {
    console.error('Error fetching notifications:', err)
    return { data: [], error: err }
  }
}

/**
 * Gets the count of unread notifications for the user.
 */
export async function getUnreadNotificationCount(userId) {
  if (!userId) return { count: 0, error: null }

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return { count: count || 0, error }
  } catch (err) {
    console.error('Error counting unread notifications:', err)
    return { count: 0, error: err }
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(notificationId, userId) {
  if (!notificationId || !userId) return { error: null }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    console.error('Error marking notification as read:', err)
    return { error: err }
  }
}

/**
 * Marks all notifications as read for the user.
 */
export async function markAllNotificationsAsRead(userId) {
  if (!userId) return { error: null }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return { error }
  } catch (err) {
    console.error('Error marking all notifications as read:', err)
    return { error: err }
  }
}

/**
 * Deletes / dismisses a single notification.
 */
export async function deleteNotification(notificationId, userId) {
  if (!notificationId || !userId) return { error: null }

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    console.error('Error deleting notification:', err)
    return { error: err }
  }
}

/**
 * Clears all notifications for the user.
 */
export async function clearAllNotifications(userId) {
  if (!userId) return { error: null }

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    return { error }
  } catch (err) {
    console.error('Error clearing notifications:', err)
    return { error: err }
  }
}

/**
 * Idempotent deterministic notification engine.
 * Generates in-app alerts based on real tasks, deadlines, and streak status.
 *
 * Guaranteed Safe:
 * - Uses deduplication keys in metadata to prevent spam on repeated visits.
 * - Respects user notification preferences.
 */
export async function syncDeterministicNotifications(userId) {
  if (!userId) return { generatedCount: 0, error: null }

  try {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)

    // Fetch user profile preferences, recent notifications, and workload in parallel
    const [profileRes, recentNotifsRes, tasksRes, deadlinesRes, sessionsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('notify_deadline_reminders, notify_daily_task_summary, notify_weekly_report')
        .eq('id', userId)
        .maybeSingle(),

      supabase
        .from('notifications')
        .select('metadata')
        .eq('user_id', userId)
        .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      supabase
        .from('tasks')
        .select('id, title, priority, status, due_date')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .neq('status', 'archived'),

      supabase
        .from('deadlines')
        .select('id, title, deadline_type, due_date')
        .eq('user_id', userId),

      supabase
        .from('study_sessions')
        .select('id, started_at')
        .eq('user_id', userId)
        .gte('started_at', new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()),
    ])

    const profile = profileRes.data || {}
    const notifyDeadlines = profile.notify_deadline_reminders ?? true
    const notifyTasks = profile.notify_daily_task_summary ?? true

    // Existing deduplication keys in the last 7 days
    const existingDedupeKeys = new Set(
      (recentNotifsRes.data || [])
        .map((n) => n.metadata?.dedupe_key)
        .filter(Boolean),
    )

    const newNotifications = []

    // 1. Check Overdue Tasks
    if (notifyTasks) {
      const overdueTasks = (tasksRes.data || []).filter((t) => {
        if (!t.due_date) return false
        return new Date(t.due_date).getTime() < now.getTime()
      })

      overdueTasks.slice(0, 3).forEach((task) => {
        const dedupeKey = `overdue_task_${task.id}_${todayStr}`
        if (!existingDedupeKeys.has(dedupeKey)) {
          newNotifications.push({
            user_id: userId,
            type: 'task_overdue',
            title: `Task Overdue: ${task.title.slice(0, 50)}`,
            message: `This ${task.priority || 'medium'}-priority task was due before today. Stay ahead by completing it now!`,
            link: '/tasks',
            metadata: { dedupe_key: dedupeKey, task_id: task.id },
          })
          existingDedupeKeys.add(dedupeKey)
        }
      })
    }

    // 2. Check Approaching & Due Deadlines
    if (notifyDeadlines) {
      const deadlines = deadlinesRes.data || []

      deadlines.forEach((dl) => {
        const dueDate = new Date(dl.due_date)
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

        // Due today (< 24h)
        if (diffHours >= -24 && diffHours <= 24) {
          const dedupeKey = `deadline_due_${dl.id}_${todayStr}`
          if (!existingDedupeKeys.has(dedupeKey)) {
            newNotifications.push({
              user_id: userId,
              type: 'deadline_due',
              title: `${dl.deadline_type?.toUpperCase() || 'DEADLINE'} Due: ${dl.title.slice(0, 50)}`,
              message: `Your ${dl.deadline_type || 'deadline'} is due today. Make sure your submissions and review are complete.`,
              link: '/deadlines',
              metadata: { dedupe_key: dedupeKey, deadline_id: dl.id },
            })
            existingDedupeKeys.add(dedupeKey)
          }
        }
        // Approaching in 24h-48h
        else if (diffHours > 24 && diffHours <= 48) {
          const dedupeKey = `deadline_approaching_${dl.id}_${todayStr}`
          if (!existingDedupeKeys.has(dedupeKey)) {
            newNotifications.push({
              user_id: userId,
              type: 'deadline_approaching',
              title: `Upcoming: ${dl.title.slice(0, 50)}`,
              message: `Approaching in less than 2 days. Schedule a dedicated review session today!`,
              link: '/deadlines',
              metadata: { dedupe_key: dedupeKey, deadline_id: dl.id },
            })
            existingDedupeKeys.add(dedupeKey)
          }
        }
      })
    }

    // 3. Check Study Streak Risk
    const sessions = sessionsRes.data || []
    const hasSessionToday = sessions.some((s) => s.started_at && s.started_at.slice(0, 10) === todayStr)

    if (!hasSessionToday && now.getHours() >= 18) {
      // In the evening after 6 PM, remind the user if they haven't logged study time today
      const dedupeKey = `streak_risk_${todayStr}`
      if (!existingDedupeKeys.has(dedupeKey)) {
        newNotifications.push({
          user_id: userId,
          type: 'streak_risk',
          title: 'Keep Your Study Streak Active',
          message: 'You have not logged a study session today yet. Log 15-30 minutes to maintain your daily learning momentum!',
          link: '/dashboard',
          metadata: { dedupe_key: dedupeKey },
        })
        existingDedupeKeys.add(dedupeKey)
      }
    }

    // Batch insert new notifications if any were generated
    if (newNotifications.length > 0) {
      const { error: insertErr } = await supabase.from('notifications').insert(newNotifications)
      if (insertErr) {
        console.warn('Error inserting generated notifications:', insertErr)
      }
      return { generatedCount: newNotifications.length, error: insertErr }
    }

    return { generatedCount: 0, error: null }
  } catch (err) {
    console.error('Error in syncDeterministicNotifications:', err)
    return { generatedCount: 0, error: err }
  }
}
