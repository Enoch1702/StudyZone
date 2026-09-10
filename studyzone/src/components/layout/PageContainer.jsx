import { cn } from '../../lib/utils'

const widths = {
  default: 'max-w-7xl',
  narrow: 'max-w-3xl',
  medium: 'max-w-5xl',
  wide: 'max-w-[1400px]',
}

export function PageContainer({ children, width = 'default', className }) {
  return (
    <div className={cn('mx-auto w-full', widths[width], className)}>
      {children}
    </div>
  )
}

export function PageHeader({ title, description, icon: Icon, actions, className }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised text-foreground shadow-2xs">
            <Icon className="h-4.5 w-4.5 text-foreground/80" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-1 text-xs text-muted sm:text-sm max-w-2xl leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">{actions}</div>}
    </div>
  )
}

export function SectionHeader({ title, description, action, className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div>
        <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
