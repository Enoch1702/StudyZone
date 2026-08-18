import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

function CheckboxControl({ id, checked, onChange }) {
  return (
    <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cn(
          'flex h-[18px] w-[18px] items-center justify-center rounded border transition-colors',
          'border-border bg-surface-raised peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40',
          checked && 'border-accent bg-accent',
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
    </span>
  )
}

export function Checkbox({ checked, onChange, className, label, id, bare = false }) {
  if (bare) {
    return (
      <CheckboxControl
        id={id}
        checked={checked}
        onChange={onChange}
        className={className}
      />
    )
  }

  return (
    <label
      htmlFor={id}
      className={cn('inline-flex cursor-pointer items-center gap-2.5', className)}
    >
      <CheckboxControl id={id} checked={checked} onChange={onChange} />
      {label && (
        <span className={cn('text-sm', checked && 'text-muted line-through')}>
          {label}
        </span>
      )}
    </label>
  )
}
