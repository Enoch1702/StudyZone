import { Menu, Moon, Search, Sun } from 'lucide-react'
import { useSearch } from '../../context/useSearch'
import { useTheme } from '../../context/useTheme'
import { NotificationPopover } from '../notifications/NotificationPopover'
import { HeaderUserMenu } from './HeaderUserMenu'

export function Header({ onMenuClick, title }) {
  const { openSearch } = useSearch()
  const { theme, setTheme } = useTheme()
  const isLight = theme === 'light'
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || '')

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border/80 bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8 shadow-2xs">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          className="rounded-lg p-2 text-muted hover:bg-surface-raised hover:text-foreground lg:hidden cursor-pointer"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent/80" aria-hidden="true" />
            <h1 className="truncate text-[15px] font-bold text-foreground sm:text-base tracking-tight">
              {title}
            </h1>
          </div>
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
          className="md:hidden rounded-lg p-2 text-muted hover:bg-surface-raised hover:text-foreground cursor-pointer"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* 1-Click Theme Toggle Button */}
        <button
          type="button"
          onClick={() => setTheme(isLight ? 'midnight' : 'light')}
          aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-raised transition-all cursor-pointer shadow-2xs"
        >
          {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-500" />}
        </button>

        {/* In-App Notifications Popover */}
        <NotificationPopover />

        {/* Interactive User Profile Dropdown Menu */}
        <HeaderUserMenu />
      </div>
    </header>
  )
}
