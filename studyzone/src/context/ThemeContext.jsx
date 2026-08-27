import { useEffect, useState } from 'react'
import { ThemeContext, THEMES } from './useTheme'

const THEME_STORAGE_KEY = 'studyzone_theme_v2'

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved
      }
    } catch {
      // ignore
    }
    return 'light'
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  function setTheme(newTheme) {
    if (THEMES.some((t) => t.id === newTheme)) {
      setThemeState(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}
