import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen,
  Bot,
  Brain,
  CalendarDays,
  CheckSquare,
  Compass,
  FileText,
  Globe,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Timer,
  TrendingUp,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { cn, getInitials } from '../../lib/utils'

const navSections = [
  {
    title: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/notes', label: 'Study Notes', icon: FileText },
      { to: '/focus', label: 'Focus Mode', icon: Timer },
      { to: '/calendar', label: 'Study Calendar', icon: CalendarDays },
      { to: '/flashcards', label: 'Flashcards', icon: Brain },
    ],
  },
  {
    title: 'Curriculum & Plans',
    items: [
      { to: '/plans', label: 'Learning Plans', icon: Compass },
      { to: '/subjects', label: 'Subjects', icon: BookOpen },
      { to: '/tasks', label: 'Tasks', icon: CheckSquare },
      { to: '/deadlines', label: 'Deadlines', icon: CalendarDays },
    ],
  },
  {
    title: 'Insights & AI',
    items: [
      { to: '/analytics', label: 'Learning Insights', icon: TrendingUp },
      { to: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function Sidebar({ open, onClose }) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const displayEmail = profile?.email || user?.email || ''

  async function handleSignOut() {
    if (onClose) onClose()
    await signOut()
    navigate('/')
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
          'fixed inset-y-0 left-0 z-50 flex w-[230px] flex-col border-r border-border bg-surface/95 backdrop-blur-md transition-transform duration-200 lg:static lg:shrink-0 lg:translate-x-0 shadow-xs',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            title="Go to Home Page"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-accent text-white shadow-sm shadow-blue-500/30">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-foreground">
              StudyZone
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-foreground lg:hidden cursor-pointer"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3 custom-scrollbar">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150',
                        isActive
                          ? 'bg-gradient-to-r from-accent/15 via-accent/10 to-transparent text-accent font-bold border-l-2 border-accent shadow-2xs'
                          : 'text-muted hover:bg-surface-raised/70 hover:text-foreground font-medium',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors duration-150',
                            isActive ? 'text-accent' : 'text-muted group-hover:text-foreground',
                          )}
                        />
                        <span className="truncate">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Public Home & User Account footer */}
        <div className="border-t border-border p-2 space-y-1.5">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-muted hover:bg-surface-raised/60 hover:text-foreground transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-muted shrink-0" />
            <span>Home Page</span>
          </NavLink>

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
