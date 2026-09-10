import { motion } from 'motion/react'
import { Inbox } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './Button'
import { fadeUp } from '../../lib/motion'

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-surface-raised text-muted">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
