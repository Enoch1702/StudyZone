import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen,
  Bot,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { cn, getInitials } from '../../lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, end: true },
  { to: '/subjects', label: 'Subjects', shortLabel: 'Subjects', icon: BookOpen },
  { to: '/tasks', label: 'Tasks', shortLabel: 'Tasks', icon: CheckSquare },
  { to: '/deadlines', label: 'Deadlines', shortLabel: 'Due', icon: CalendarDays },
  { to: '/ai-assistant', label: 'AI Assistant', shortLabel: 'AI', icon: Bot },
  { to: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
]

export function Sidebar({ open, onClose }) {
  const { profile, user, signOut } = useAuth()
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const displayEmail = profile?.email || user?.email || ''

  async function handleSignOut() {
    await signOut()
    if (onClose) onClose()
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:shrink-0 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted border border-accent/20">
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

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors duration-150',
                  isActive
                    ? 'text-accent font-semibold'
                    : 'text-muted hover:bg-surface-raised/60 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-md bg-accent-muted border border-accent/20"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4 shrink-0 transition-transform duration-150" />
                  <span className="relative z-10">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Account & Sign Out footer */}
        <div className="border-t border-border p-2">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-raised/60 p-2 border border-border/50 transition-colors hover:border-border">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-[10px] font-bold text-accent uppercase"
                aria-hidden="true"
              >
                {getInitials(displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{displayName}</p>
                <p className="truncate text-[10px] text-muted-foreground">{displayEmail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="shrink-0 rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors active:scale-95"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
