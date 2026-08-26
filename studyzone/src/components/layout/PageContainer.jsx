import { cn } from '../../lib/utils'

const widths = {
  default: 'max-w-[1280px]',
  narrow: 'max-w-3xl',
  medium: 'max-w-4xl',
  wide: 'max-w-[1440px]',
}

export function PageContainer({ children, width = 'default', className }) {
  return (
    <div className={cn('mx-auto w-full', widths[width], className)}>
      {children}
    </div>
  )
}

export function PageHeader({ title, description, icon: Icon, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/8 text-accent">
            <Icon className="h-5 w-5 text-accent" />
          </div>
        )}
        <div>
          {title && (
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-muted sm:text-sm max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0 self-start sm:self-auto">{actions}</div>}
    </div>
  )
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
