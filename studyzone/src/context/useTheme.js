import { createContext, useContext } from 'react'

export const THEMES = [
  {
    id: 'light',
    name: 'StudyZone Light',
    description: 'Clean, warm neutral daylight workspace for focused study',
    accentColor: '#2563eb',
    surfaceColor: '#ffffff',
    bgColor: '#f8fafc',
    isLight: true,
  },
  {
    id: 'midnight',
    name: 'Midnight Slate',
    description: 'Classic dark zinc with clean blue accent',
    accentColor: '#4f7cff',
    surfaceColor: '#121215',
    bgColor: '#09090b',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Deep abyss navy with cyan ice accent',
    accentColor: '#38bdf8',
    surfaceColor: '#0c1624',
    bgColor: '#070e17',
  },
  {
    id: 'emerald',
    name: 'Nordic Forest',
    description: 'Deep pine woods with vivid emerald accent',
    accentColor: '#10b981',
    surfaceColor: '#0b1c15',
    bgColor: '#06120d',
  },
  {
    id: 'amethyst',
    name: 'Obsidian Amethyst',
    description: 'Deep obsidian violet with royal purple accent',
    accentColor: '#a855f7',
    surfaceColor: '#140f21',
    bgColor: '#0c0914',
  },
  {
    id: 'espresso',
    name: 'Warm Espresso',
    description: 'Warm dark cocoa with rich amber gold accent',
    accentColor: '#f59e0b',
    surfaceColor: '#191410',
    bgColor: '#110d0b',
  },
]

export const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  themes: THEMES,
})

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
