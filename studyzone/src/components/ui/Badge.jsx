import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-surface-raised text-muted border-border',
  accent: 'bg-accent-muted text-accent border-accent/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
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
