import { useState, useEffect, useCallback } from 'react'
import { SearchContext } from './useSearch'

const RECENT_SEARCHES_KEY = 'studyzone_recent_searches'
const MAX_RECENT = 5

export function SearchProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const openSearch = useCallback(() => setIsOpen(true), [])
  const closeSearch = useCallback(() => setIsOpen(false), [])
  const toggleSearch = useCallback(() => setIsOpen((prev) => !prev), [])

  // Global Ctrl+K / Cmd+K keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSearch])

  // Save item to recent searches
  const addRecentSearch = useCallback((item) => {
    if (!item || !item.id) return

    setRecentSearches((prev) => {
      // Remove existing occurrence if already present (to move to top)
      const filtered = prev.filter((r) => r.id !== item.id)
      const updated = [item, ...filtered].slice(0, MAX_RECENT)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch {
        // ignore localStorage errors
      }
      return updated
    })
  }, [])

  // Remove single recent item
  const removeRecentSearch = useCallback((itemId) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((r) => r.id !== itemId)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = {
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  }

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}
