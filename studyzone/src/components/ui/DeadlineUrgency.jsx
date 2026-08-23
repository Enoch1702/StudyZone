import { AlertCircle, Clock, CircleCheck } from 'lucide-react'
import { cn, getDeadlineUrgency } from '../../lib/utils'

const config = {
  urgent: {
    icon: AlertCircle,
    dotClass: 'bg-danger animate-pulse',
    textClass: 'text-danger',
  },
  approaching: {
    icon: Clock,
    dotClass: 'bg-warning',
    textClass: 'text-warning',
  },
  normal: {
    icon: CircleCheck,
    dotClass: 'bg-muted-foreground',
    textClass: 'text-muted',
  },
}

export function DeadlineUrgency({ date, showDetail = true, className }) {
  const urgency = getDeadlineUrgency(date)
  const { icon: Icon, dotClass, textClass } = config[urgency.level]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClass)}
        aria-hidden="true"
      />
      <Icon className={cn('h-3.5 w-3.5 shrink-0', textClass)} aria-hidden="true" />
      <span className="text-xs font-medium text-foreground">{urgency.label}</span>
      {showDetail && (
        <span className="text-xs text-muted-foreground">· {urgency.detail}</span>
      )}
    </div>
  )
}
