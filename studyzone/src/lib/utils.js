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
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
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

export function daysUntil(dateStr) {
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
