import { Bell, Menu, Search } from 'lucide-react'
import { Input } from '../ui/Input'
import { mockUserProfile } from '../../data/mockData'
import { getInitials } from '../../lib/utils'

export function Header({ onMenuClick, title }) {
  const { displayName } = mockUserProfile

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          className="rounded-md p-2 text-muted hover:bg-surface-raised hover:text-foreground lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="truncate text-[15px] font-semibold text-foreground sm:text-base">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 w-44 pl-8 text-[13px] lg:w-52"
            aria-label="Search"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-md p-2 text-muted hover:bg-surface-raised hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        <div className="flex items-center gap-2 border-l border-border pl-2 sm:gap-2.5 sm:pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-foreground">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">Student</p>
          </div>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-raised text-[11px] font-semibold text-accent"
            aria-hidden="true"
          >
            {getInitials(displayName)}
          </div>
        </div>
      </div>
    </header>
  )
}
