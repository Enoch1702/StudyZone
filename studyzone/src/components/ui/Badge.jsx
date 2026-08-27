import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-surface-raised text-muted border-border',
  accent: 'bg-accent-muted text-accent border-accent/25',
  success: 'bg-success-muted text-success border-success/30',
  warning: 'bg-warning-muted text-warning border-warning/30',
  danger: 'bg-danger-muted text-danger border-danger/30',
  ai: 'bg-ai-muted text-ai-accent border-ai-accent/30',
  neutral: 'bg-surface text-muted border-border-subtle',
}

export function Badge({ className, variant = 'default', children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const config = {
    urgent: { label: 'Urgent', variant: 'danger' },
    high: { label: 'High', variant: 'danger' },
    medium: { label: 'Medium', variant: 'warning' },
    low: { label: 'Low', variant: 'default' },
  }
  const { label, variant } = config[priority] ?? config.medium

  return <Badge variant={variant}>{label}</Badge>
}
