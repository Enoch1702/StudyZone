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

export function PageHeader({ description, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      )}
      {actions && <div className="shrink-0">{actions}</div>}
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
