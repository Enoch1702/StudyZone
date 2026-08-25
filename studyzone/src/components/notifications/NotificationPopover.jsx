import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  syncDeterministicNotifications,
} from '../../services/notificationService'
import { cn } from '../../lib/utils'

function getNotificationIcon(type) {
  switch (type) {
    case 'task_overdue':
      return { icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' }
    case 'deadline_due':
      return { icon: CalendarDays, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' }
    case 'deadline_approaching':
      return { icon: Clock, color: 'text-accent bg-accent/10 border-accent/30' }
    case 'streak_risk':
      return { icon: Flame, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' }
    case 'streak_milestone':
      return { icon: Flame, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' }
    default:
      return { icon: Info, color: 'text-muted bg-surface-raised border-border' }
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function NotificationPopover() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const popoverRef = useRef(null)

  // Load notifications and run idempotent sync on mount or when user changes
  useEffect(() => {
    let isMounted = true

    async function fetchUserNotifications() {
      if (!user?.id) return

      try {
        await syncDeterministicNotifications(user.id)
        const [listRes, countRes] = await Promise.all([
          getNotifications(user.id),
          getUnreadNotificationCount(user.id),
        ])

        if (isMounted) {
          if (listRes.data) setNotifications(listRes.data)
          if (countRes.count !== undefined) setUnreadCount(countRes.count)
        }
      } catch (err) {
        console.warn('Could not load notifications:', err)
      }
    }

    fetchUserNotifications()

    return () => {
      isMounted = false
    }
  }, [user])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Mark single as read and navigate
  async function handleClickNotification(notification) {
    if (!user?.id) return

    if (!notification.is_read) {
      await markNotificationAsRead(notification.id, user.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }

    setIsOpen(false)

    if (notification.link) {
      navigate(notification.link)
    }
  }

  // Mark all as read
  async function handleMarkAllRead() {
    if (!user?.id || unreadCount === 0) return
    await markAllNotificationsAsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  // Delete notification
  async function handleDelete(e, notificationId) {
    e.stopPropagation()
    if (!user?.id) return

    const notif = notifications.find((n) => n.id === notificationId)
    await deleteNotification(notificationId, user.id)

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    if (notif && !notif.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1))
    }
  }

  // Clear all
  async function handleClearAll() {
    if (!user?.id || notifications.length === 0) return
    await clearAllNotifications(user.id)
    setNotifications([])
    setUnreadCount(0)
  }

  async function handleTogglePopover() {
    const nextState = !isOpen
    setIsOpen(nextState)

    if (nextState && user?.id) {
      const [listRes, countRes] = await Promise.all([
        getNotifications(user.id),
        getUnreadNotificationCount(user.id),
      ])
      if (listRes.data) setNotifications(listRes.data)
      if (countRes.count !== undefined) setUnreadCount(countRes.count)
    }
  }

  return (
    <div ref={popoverRef} className="relative">
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={handleTogglePopover}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        className={cn(
          'relative rounded-xl p-2 text-muted transition-all cursor-pointer',
          isOpen ? 'bg-surface-raised text-foreground' : 'hover:bg-surface-raised hover:text-foreground',
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-border/90 bg-surface shadow-2xl overflow-hidden"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-border/80 bg-surface-raised/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent border border-accent/30">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-accent hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-medium text-muted hover:text-danger cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[65vh] overflow-y-auto divide-y divide-border/40 p-1">
              {notifications.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-surface-raised border border-border text-muted mb-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">You&apos;re all caught up</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    No new alerts or deadlines. Keep up your great momentum!
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const { icon: Icon, color } = getNotificationIcon(n.type)

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClickNotification(n)}
                      className={cn(
                        'group flex items-start justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all',
                        n.is_read
                          ? 'hover:bg-surface-raised/50 opacity-80'
                          : 'bg-accent/8 border border-accent/20 hover:bg-accent/15',
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs',
                            color,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn('text-xs truncate', n.is_read ? 'font-medium text-foreground' : 'font-bold text-foreground')}>
                            {n.title}
                          </p>
                          {n.message && (
                            <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                          )}
                          <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, n.id)}
                          className="rounded p-1 text-muted hover:text-danger hover:bg-surface-raised"
                          aria-label="Dismiss notification"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
