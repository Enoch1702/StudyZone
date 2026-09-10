import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  LogOut,
  Search,
  Settings,
  User,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useSearch } from '../../context/useSearch'
import { getInitials, cn } from '../../lib/utils'

export function HeaderUserMenu() {
  const { profile, user, signOut } = useAuth()
  const { openSearch } = useSearch()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || '')

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'
  const email = profile?.email || user?.email || ''

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  async function handleSignOut() {
    setIsOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="User profile menu"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-2 border-l border-border pl-2 sm:gap-2.5 sm:pl-3 cursor-pointer rounded-lg p-1 transition-all',
          isOpen ? 'bg-surface-raised' : 'hover:bg-surface-raised/60',
        )}
      >
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium text-foreground truncate max-w-[130px]">{displayName}</p>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-[11px] font-semibold text-accent uppercase shadow-2xs"
          aria-hidden="true"
        >
          {getInitials(displayName)}
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-border bg-surface shadow-lg overflow-hidden py-1"
          >
            {/* Header info */}
            <div className="px-3.5 py-2.5 border-b border-border/60">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3.5 w-3.5 text-muted" />
                <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              </div>
              <p className="text-[11px] text-muted truncate">{email}</p>
            </div>

            {/* Menu Links */}
            <div className="py-1">
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-surface-raised hover:text-accent transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-muted" />
                <span>Settings & Preferences</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  openSearch()
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-foreground hover:bg-surface-raised hover:text-accent transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="h-3.5 w-3.5 text-muted" />
                  <span>Search Workspace</span>
                </div>
                <kbd className="rounded border border-border bg-surface-raised px-1.5 py-0.5 text-[9px] font-mono text-muted">
                  {isMac ? '⌘K' : 'Ctrl K'}
                </kbd>
              </button>
            </div>

            {/* Sign Out */}
            <div className="border-t border-border/60 pt-1">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
