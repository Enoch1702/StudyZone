import { formatDate } from '../lib/utils'

/**
 * Computes the single best "Smart Next Action" deterministically based on real user data.
 *
 * @param {Object} params
 * @param {Array} params.tasks
 * @param {Array} params.deadlines
 * @param {Array} params.subjects
 * @param {Array} params.plans
 * @param {Array} params.milestones
 * @param {Array} params.sessions
 * @returns {Object|null} The recommended action object with transparent rationale
 */
export function computeSmartNextAction({
  tasks = [],
  deadlines = [],
  subjects = [],
  plans = [],
  milestones = [],
  sessions = [],
}) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const subjectMap = new Map((subjects || []).map((s) => [s.id, s.name]))
  const pendingTasks = (tasks || []).filter(
    (t) => t.status !== 'completed' && t.status !== 'archived',
  )

  // 1. Check for Overdue High/Urgent Priority Task
  const overdueHighTask = pendingTasks.find((t) => {
    if (!t.due_date) return false
    const isOverdue = new Date(t.due_date).getTime() < now.getTime()
    return isOverdue && (t.priority === 'high' || t.priority === 'urgent')
  })

  if (overdueHighTask) {
    const subName = subjectMap.get(overdueHighTask.subject_id)
    return {
      id: `smart-task-${overdueHighTask.id}`,
      type: 'task',
      priorityRank: 1,
      badge: 'URGENT OVERDUE',
      badgeVariant: 'danger',
      title: overdueHighTask.title,
      subjectName: subName,
      subjectId: overdueHighTask.subject_id,
      taskId: overdueHighTask.id,
      reason: `Overdue high-priority task (due ${formatDate(overdueHighTask.due_date)}). Tackling this now clears critical backlog.`,
      action: {
        label: 'Start Focus',
        route: '/focus',
        state: { taskId: overdueHighTask.id, subjectId: overdueHighTask.subject_id },
      },
    }
  }

  // 2. Check for Deadline Due Today
  const deadlineDueToday = (deadlines || []).find((d) => {
    if (!d.due_date) return false
    const dStr = new Date(d.due_date).toISOString().slice(0, 10)
    return dStr === todayStr
  })

  if (deadlineDueToday) {
    const subName = subjectMap.get(deadlineDueToday.subject_id)
    const linkedTask = pendingTasks.find((t) => t.subject_id === deadlineDueToday.subject_id)

    return {
      id: `smart-deadline-${deadlineDueToday.id}`,
      type: 'deadline',
      priorityRank: 2,
      badge: 'DEADLINE TODAY',
      badgeVariant: 'danger',
      title: deadlineDueToday.title,
      subjectName: subName,
      subjectId: deadlineDueToday.subject_id,
      taskId: linkedTask?.id || null,
      reason: `${deadlineDueToday.deadline_type?.toUpperCase() || 'DEADLINE'} is due today. Complete submissions and final revision.`,
      action: {
        label: 'Start Focus',
        route: '/focus',
        state: {
          taskId: linkedTask?.id || null,
          subjectId: deadlineDueToday.subject_id,
        },
      },
    }
  }

  // 3. Check for Task Due Today
  const taskDueToday = pendingTasks.find((t) => {
    if (!t.due_date) return false
    return t.due_date.slice(0, 10) === todayStr
  })

  if (taskDueToday) {
    const subName = subjectMap.get(taskDueToday.subject_id)
    return {
      id: `smart-task-${taskDueToday.id}`,
      type: 'task',
      priorityRank: 3,
      badge: 'DUE TODAY',
      badgeVariant: 'warning',
      title: taskDueToday.title,
      subjectName: subName,
      subjectId: taskDueToday.subject_id,
      taskId: taskDueToday.id,
      reason: `Scheduled for completion today to maintain study momentum and avoid spillover.`,
      action: {
        label: 'Start Focus',
        route: '/focus',
        state: { taskId: taskDueToday.id, subjectId: taskDueToday.subject_id },
      },
    }
  }

  // 4. Check for Upcoming Urgent Deadline (<48h)
  const approachingDeadline = (deadlines || []).find((d) => {
    if (!d.due_date) return false
    const dTime = new Date(d.due_date).getTime()
    return dTime > now.getTime() && dTime <= in48h.getTime()
  })

  if (approachingDeadline) {
    const subName = subjectMap.get(approachingDeadline.subject_id)
    const linkedTask = pendingTasks.find((t) => t.subject_id === approachingDeadline.subject_id)

    return {
      id: `smart-deadline-${approachingDeadline.id}`,
      type: 'deadline',
      priorityRank: 4,
      badge: 'UPCOMING DEADLINE',
      badgeVariant: 'warning',
      title: approachingDeadline.title,
      subjectName: subName,
      subjectId: approachingDeadline.subject_id,
      taskId: linkedTask?.id || null,
      reason: `Approaching in under 48 hours. Schedule a dedicated deep focus block today.`,
      action: {
        label: 'Start Focus',
        route: '/focus',
        state: { taskId: linkedTask?.id || null, subjectId: approachingDeadline.subject_id },
      },
    }
  }

  // 5. Check for General High Priority Task
  const highPriorityTask = pendingTasks.find((t) => t.priority === 'high' || t.priority === 'urgent')
  if (highPriorityTask) {
    const subName = subjectMap.get(highPriorityTask.subject_id)
    return {
      id: `smart-task-${highPriorityTask.id}`,
      type: 'task',
      priorityRank: 5,
      badge: 'HIGH PRIORITY',
      badgeVariant: 'accent',
      title: highPriorityTask.title,
      subjectName: subName,
      subjectId: highPriorityTask.subject_id,
      taskId: highPriorityTask.id,
      reason: `Top-ranked priority task in your queue.`,
      action: {
        label: 'Start Focus',
        route: '/focus',
        state: { taskId: highPriorityTask.id, subjectId: highPriorityTask.subject_id },
      },
    }
  }

  // 6. Check for Neglected Subject with Pending Tasks
  const recentSubjectIdsWithSessions = new Set(
    (sessions || [])
      .filter((s) => {
        if (!s.started_at) return false
        const sTime = new Date(s.started_at).getTime()
        return now.getTime() - sTime < 7 * 24 * 60 * 60 * 1000
      })
      .map((s) => s.subject_id)
      .filter(Boolean),
  )

  const neglectedSubject = (subjects || []).find((s) => !recentSubjectIdsWithSessions.has(s.id))
  if (neglectedSubject) {
    const taskForNeglected = pendingTasks.find((t) => t.subject_id === neglectedSubject.id)
    if (taskForNeglected) {
      return {
        id: `smart-subject-${neglectedSubject.id}`,
        type: 'subject',
        priorityRank: 6,
        badge: 'BALANCE RESTORATION',
        badgeVariant: 'accent',
        title: taskForNeglected.title,
        subjectName: neglectedSubject.name,
        subjectId: neglectedSubject.id,
        taskId: taskForNeglected.id,
        reason: `No study sessions logged for "${neglectedSubject.name}" this week. Balance your learning areas.`,
        action: {
          label: 'Start Focus',
          route: '/focus',
          state: { taskId: taskForNeglected.id, subjectId: neglectedSubject.id },
        },
      }
    }
  }

  // 7. Check for Active Learning Plan Milestone Task
  const activePlan = (plans || []).find((p) => p.status === 'active')
  if (activePlan) {
    const pendingMilestone = (milestones || []).find(
      (m) => m.plan_id === activePlan.id && m.status !== 'completed',
    )
    if (pendingMilestone) {
      const milestoneTask = pendingTasks.find((t) => t.milestone_id === pendingMilestone.id)
      if (milestoneTask) {
        return {
          id: `smart-milestone-${pendingMilestone.id}`,
          type: 'milestone',
          priorityRank: 7,
          badge: 'ROADMAP MILESTONE',
          badgeVariant: 'accent',
          title: milestoneTask.title,
          subjectName: activePlan.title,
          subjectId: milestoneTask.subject_id,
          taskId: milestoneTask.id,
          reason: `Next action in "${activePlan.title}" · ${pendingMilestone.title}.`,
          action: {
            label: 'Start Focus',
            route: '/focus',
            state: { taskId: milestoneTask.id, subjectId: milestoneTask.subject_id },
          },
        }
      }
    }
  }

  // 8. General First Pending Task Fallback
  if (pendingTasks.length > 0) {
    const firstTask = pendingTasks[0]
    const subName = subjectMap.get(firstTask.subject_id)
    return {
      id: `smart-task-${firstTask.id}`,
      type: 'task',
      priorityRank: 8,
      badge: 'NEXT TASK',
      badgeVariant: 'default',
      title: firstTask.title,
      subjectName: subName,
      subjectId: firstTask.subject_id,
      taskId: firstTask.id,
      reason: `Next item in your study queue. Start a focus block to make steady progress.`,
      action: {
        label: 'Start Focus',
        route: '/focus',
        state: { taskId: firstTask.id, subjectId: firstTask.subject_id },
      },
    }
  }

  return null
}
