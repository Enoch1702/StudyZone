import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, end: true },
  { to: '/subjects', label: 'Subjects', shortLabel: 'Subjects', icon: BookOpen },
  { to: '/tasks', label: 'Tasks', shortLabel: 'Tasks', icon: CheckSquare },
  { to: '/deadlines', label: 'Deadlines', shortLabel: 'Due', icon: CalendarDays },
  { to: '/ai-assistant', label: 'AI Assistant', shortLabel: 'AI', icon: Bot },
  { to: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
]

export function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:shrink-0 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted">
              <GraduationCap className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              StudyZone
            </span>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-foreground lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-accent-muted text-accent'
                    : 'text-muted hover:bg-surface-raised hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
