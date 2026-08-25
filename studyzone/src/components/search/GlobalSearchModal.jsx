import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Compass,
  History,
  LayoutDashboard,
  Milestone,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  X,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react'
import { useSearch } from '../../context/useSearch'
import { useAuth } from '../../context/useAuth'
import { searchWorkspace } from '../../services/searchService'
import { cn } from '../../lib/utils'

const QUICK_COMMANDS = [
  {
    id: 'cmd-dashboard',
    type: 'command',
    category: 'Quick Commands',
    title: 'Go to Dashboard',
    subtitle: 'Workspace overview and daily focus',
    icon: LayoutDashboard,
    route: '/',
  },
  {
    id: 'cmd-analytics',
    type: 'command',
    category: 'Quick Commands',
    title: 'Go to Learning Insights',
    subtitle: 'Study consistency, learning balance, and workload analytics',
    icon: TrendingUp,
    route: '/analytics',
  },
  {
    id: 'cmd-plans',
    type: 'command',
    category: 'Quick Commands',
    title: 'Go to Learning Plans',
    subtitle: 'Track persistent roadmaps and milestones',
    icon: Compass,
    route: '/plans',
  },
  {
    id: 'cmd-subjects',
    type: 'command',
    category: 'Quick Commands',
    title: 'Go to Subjects',
    subtitle: 'Manage courses and learning areas',
    icon: BookOpen,
    route: '/subjects',
  },
  {
    id: 'cmd-tasks',
    type: 'command',
    category: 'Quick Commands',
    title: 'Go to Tasks',
    subtitle: 'View and organize actionable study tasks',
    icon: CheckSquare,
    route: '/tasks',
  },
  {
    id: 'cmd-deadlines',
    type: 'command',
    category: 'Quick Commands',
    title: 'Go to Deadlines',
    subtitle: 'Track exams, assignments, and milestones',
    icon: CalendarDays,
    route: '/deadlines',
  },
  {
    id: 'cmd-ai',
    type: 'command',
    category: 'Quick Commands',
    title: 'Ask AI Study Assistant',
    subtitle: 'Personalized study planning, revision, and recommendations',
    icon: Sparkles,
    route: '/ai-assistant',
  },
  {
    id: 'cmd-settings',
    type: 'command',
    category: 'Quick Commands',
    title: 'Open Settings',
    subtitle: 'Manage profile and learner preferences',
    icon: Settings,
    route: '/settings',
  },
]

function getCategoryIcon(type) {
  switch (type) {
    case 'subject':
      return BookOpen
    case 'task':
      return CheckSquare
    case 'deadline':
      return CalendarDays
    case 'plan':
      return Compass
    case 'milestone':
      return Milestone
    case 'command':
      return ArrowRight
    default:
      return Search
  }
}

/**
 * Inner search dialog component.
 * Mounts freshly each time the modal opens, ensuring clean initial state.
 */
function SearchDialog({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearch()

  const [query, setQuery] = useState('')
  const [resultsByCategory, setResultsByCategory] = useState({})
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Execute debounced search when query changes
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) return

    clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(async () => {
      if (!user?.id) return
      setIsLoading(true)
      const res = await searchWorkspace({ userId: user.id, query: trimmed })
      setResultsByCategory(res.resultsByCategory || {})
      setTotalResults(res.totalResults || 0)
      setIsLoading(false)
      setSelectedIndex(0)
    }, 200)

    return () => clearTimeout(debounceTimerRef.current)
  }, [query, user?.id])

  // Flatten currently visible items for keyboard navigation
  const isSearching = query.trim().length > 0

  const flatItems = useMemo(() => {
    if (isSearching) {
      const items = []
      Object.entries(resultsByCategory).forEach(([, categoryItems]) => {
        items.push(...categoryItems)
      })
      return items
    }
    return [...recentSearches, ...QUICK_COMMANDS]
  }, [isSearching, resultsByCategory, recentSearches])

  const handleSelectItem = useCallback(
    (item) => {
      if (!item || !item.route) return

      if (item.type !== 'command') {
        addRecentSearch(item)
      }

      onClose()
      navigate(item.route)
    },
    [addRecentSearch, onClose, navigate],
  )

  // Global key navigation inside modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (flatItems.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % flatItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = flatItems[selectedIndex]
        if (selected) {
          handleSelectItem(selected)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flatItems, selectedIndex, onClose, handleSelectItem])

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 bg-black/75 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="flex flex-col w-full max-w-2xl max-h-[82vh] rounded-2xl border border-border/90 bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/80 bg-surface-raised/40">
          <Search className={cn('h-5 w-5 shrink-0 text-muted', isLoading && 'animate-pulse text-accent')} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value
              setQuery(val)
              if (!val.trim()) {
                setResultsByCategory({})
                setTotalResults(0)
                setIsLoading(false)
                setSelectedIndex(0)
              }
            }}
            placeholder="Search subjects, tasks, deadlines, plans, commands..."
            className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResultsByCategory({})
                setTotalResults(0)
                setSelectedIndex(0)
              }}
              className="rounded-lg p-1 text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-surface-raised border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
            ESC
          </kbd>
        </div>

        {/* Search Results / Command List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-border/40">
          {isSearching ? (
            /* Categorized Search Results View */
            totalResults > 0 ? (
              Object.entries(resultsByCategory).map(([category, items]) => (
                <div key={category} className="py-2 first:pt-0 last:pb-0">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="mt-1 space-y-1">
                    {items.map((item) => {
                      const globalIdx = flatItems.findIndex((fi) => fi.id === item.id)
                      const isSelected = globalIdx === selectedIndex
                      const Icon = getCategoryIcon(item.type)

                      return (
                        <div
                          key={item.id}
                          data-index={globalIdx}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={cn(
                            'group flex items-center justify-between rounded-xl px-3 py-2.5 text-left cursor-pointer transition-all',
                            isSelected
                              ? 'bg-accent/15 border border-accent/40 text-foreground'
                              : 'hover:bg-surface-raised/60 text-foreground border border-transparent',
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted transition-colors',
                                isSelected
                                  ? 'border-accent/40 bg-accent text-white'
                                  : 'border-border bg-surface-raised',
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold truncate text-foreground">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-muted truncate">{item.subtitle}</p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="hidden sm:flex items-center gap-1 text-[11px] text-accent font-medium pl-2 shrink-0">
                              <span>Open</span>
                              <CornerDownLeft className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : !isLoading ? (
              /* No Results State */
              <div className="py-12 text-center">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-surface-raised border border-border text-muted mb-3">
                  <Search className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  Check your spelling or try searching for subjects, tasks, deadlines, or learning plans.
                </p>
              </div>
            ) : null
          ) : (
            /* Default Empty Query View: Recent Searches + Quick Commands */
            <>
              {/* Recent Searches (if available) */}
              {recentSearches.length > 0 && (
                <div className="py-2 first:pt-0">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-muted" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearRecentSearches()
                      }}
                      className="text-[11px] text-muted hover:text-danger transition-colors"
                    >
                      Clear history
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {recentSearches.map((item) => {
                      const globalIdx = flatItems.findIndex((fi) => fi.id === item.id)
                      const isSelected = globalIdx === selectedIndex
                      const Icon = getCategoryIcon(item.type)

                      return (
                        <div
                          key={item.id}
                          data-index={globalIdx}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={cn(
                            'group flex items-center justify-between rounded-xl px-3 py-2 text-left cursor-pointer transition-all',
                            isSelected
                              ? 'bg-accent/15 border border-accent/40 text-foreground'
                              : 'hover:bg-surface-raised/60 text-foreground border border-transparent',
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-muted',
                                isSelected ? 'border-accent/40 bg-accent text-white' : 'border-border bg-surface-raised',
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate text-foreground">{item.title}</p>
                              <p className="text-[10px] text-muted truncate">{item.category} · {item.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="hidden sm:inline text-[10px] text-accent font-medium">Jump to</span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeRecentSearch(item.id)
                              }}
                              className="rounded p-1 text-muted hover:text-danger hover:bg-surface-raised"
                              aria-label="Remove from recent"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quick Navigation Commands */}
              <div className="py-2">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Quick Commands & Navigation
                </div>
                <div className="mt-1 space-y-1">
                  {QUICK_COMMANDS.map((cmd) => {
                    const globalIdx = flatItems.findIndex((fi) => fi.id === cmd.id)
                    const isSelected = globalIdx === selectedIndex
                    const Icon = cmd.icon

                    return (
                      <div
                        key={cmd.id}
                        data-index={globalIdx}
                        onClick={() => handleSelectItem(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          'group flex items-center justify-between rounded-xl px-3 py-2 text-left cursor-pointer transition-all',
                          isSelected
                            ? 'bg-accent/15 border border-accent/40 text-foreground'
                            : 'hover:bg-surface-raised/60 text-foreground border border-transparent',
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-muted',
                              isSelected ? 'border-accent/40 bg-accent text-white' : 'border-border bg-surface-raised',
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-foreground">{cmd.title}</p>
                            <p className="text-[10px] text-muted truncate">{cmd.subtitle}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="hidden sm:flex items-center gap-1 text-[10px] text-accent font-medium shrink-0">
                            <span>Go</span>
                            <CornerDownLeft className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/80 bg-surface-raised/30 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-surface-raised border border-border px-1.5 py-0.5 text-[10px] font-mono">↑</kbd>
              <kbd className="rounded bg-surface-raised border border-border px-1.5 py-0.5 text-[10px] font-mono">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-surface-raised border border-border px-1.5 py-0.5 text-[10px] font-mono">↵</kbd>
              <span>Open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-surface-raised border border-border px-1.5 py-0.5 text-[10px] font-mono">ESC</kbd>
              <span>Close</span>
            </span>
          </div>

          {isSearching && (
            <span className="font-medium text-foreground/80">
              {totalResults} {totalResults === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function GlobalSearchModal() {
  const { isOpen, closeSearch } = useSearch()

  return (
    <AnimatePresence>
      {isOpen && <SearchDialog onClose={closeSearch} />}
    </AnimatePresence>
  )
}
