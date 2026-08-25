import { Bell, Menu, Search } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useSearch } from '../../context/useSearch'
import { getInitials } from '../../lib/utils'
import { getLearnerTypeShortLabel } from '../../lib/learnerProfile'

export function Header({ onMenuClick, title }) {
  const { profile, user } = useAuth()
  const { openSearch } = useSearch()

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const learnerBadge = getLearnerTypeShortLabel(profile?.learner_type)

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || '')

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
        {/* Desktop Global Search Trigger */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search workspace"
          className="group relative hidden md:flex items-center justify-between h-8.5 w-48 lg:w-56 rounded-xl border border-border bg-surface px-3 text-xs text-muted hover:border-accent/40 hover:bg-surface-raised hover:text-foreground transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-3.5 w-3.5 text-muted group-hover:text-accent transition-colors shrink-0" />
            <span className="truncate">Search workspace...</span>
          </div>
          <kbd className="rounded border border-border/80 bg-surface-raised px-1.5 py-0.5 text-[10px] font-mono text-muted group-hover:text-foreground shrink-0">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>

        {/* Mobile Global Search Button */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search workspace"
          className="md:hidden rounded-lg p-2 text-muted hover:bg-surface-raised hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notification Bell (Preserved for Phase 10) */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-muted hover:bg-surface-raised hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-2 border-l border-border pl-2 sm:gap-2.5 sm:pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{displayName}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{learnerBadge}</p>
          </div>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-raised text-[11px] font-semibold text-accent uppercase"
            aria-hidden="true"
          >
            {getInitials(displayName)}
          </div>
        </div>
      </div>
    </header>
  )
}
