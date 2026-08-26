export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Safely converts an ISO timestamp or date input to local YYYY-MM-DD format
 * avoiding timezone offset date shifts.
 */
export function toLocalDateKey(dateInput) {
  if (!dateInput) return null
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return null
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format total seconds into MM:SS format for countdown timers.
 */
export function formatSeconds(totalSeconds) {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60)
  const secs = Math.floor(Math.max(0, totalSeconds) % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatDuration(minutes) {
  const mins = Math.max(0, Math.round(Number(minutes) || 0))
  if (mins === 0) return '0m'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

export function formatMinutesToHoursMinutes(minutes) {
  return formatDuration(minutes)
}

/**
 * Friendly formatter for conversation message timestamps.
 */
export function formatConversationTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Creates a fast lookup map for subjects by id.
 */
export function createSubjectLookup(subjects = []) {
  const map = new Map()
  for (const s of subjects) {
    if (s?.id) map.set(s.id, s)
  }
  return {
    get: (id) => map.get(id),
    getName: (id) => map.get(id)?.name || 'General',
    getColor: (id) => map.get(id)?.color || '#6366f1',
    has: (id) => map.has(id),
    map,
  }
}

export function daysUntil(dateStr) {
  if (!dateStr) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

/**
 * Deadline urgency tiers for consistent UI treatment.
 * @returns {{ level: 'urgent' | 'approaching' | 'normal', label: string, detail: string, variant: string }}
 */
export function getDeadlineUrgency(dateStr) {
  const days = daysUntil(dateStr)

  if (days < 0) {
    const overdueDays = Math.abs(days)
    return {
      level: 'urgent',
      label: 'Overdue',
      detail: `${overdueDays} day${overdueDays !== 1 ? 's' : ''} ago`,
      variant: 'danger',
    }
  }

  if (days === 0) {
    return {
      level: 'urgent',
      label: 'Due today',
      detail: 'Due today',
      variant: 'danger',
    }
  }

  if (days <= 3) {
    return {
      level: 'urgent',
      label: 'Urgent',
      detail: `${days} day${days !== 1 ? 's' : ''} left`,
      variant: 'danger',
    }
  }

  if (days <= 7) {
    return {
      level: 'approaching',
      label: 'Approaching',
      detail: `${days} days left`,
      variant: 'warning',
    }
  }

  return {
    level: 'normal',
    label: 'On track',
    detail: `${days} days left`,
    variant: 'default',
  }
}
