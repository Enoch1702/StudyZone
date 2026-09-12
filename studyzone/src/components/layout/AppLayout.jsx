import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { GlobalAudioBar } from './GlobalAudioBar'
import { SearchProvider } from '../../context/SearchContext'
import { GlobalSearchModal } from '../search/GlobalSearchModal'
import { LearnerOnboardingModal } from '../onboarding/LearnerOnboardingModal'
import { useAuth } from '../../context/useAuth'
import { pageEntrance } from '../../lib/motion'
import { cn } from '../../lib/utils'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/': 'Dashboard',
  '/notes': 'Study Notes',
  '/focus': 'Focus Mode',
  '/calendar': 'Study Calendar',
  '/flashcards': 'Flashcards',
  '/analytics': 'Learning Insights',
  '/plans': 'Learning Plans',
  '/subjects': 'Subjects',
  '/tasks': 'Tasks',
  '/deadlines': 'Deadlines',
  '/ai-assistant': 'AI Study Assistant',
  '/settings': 'Settings',
}

export function AppLayout() {
  const { user, profile } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Dynamically resolve titles (including dynamic detail routes like /plans/:planId)
  let title = pageTitles[location.pathname]
  if (!title) {
    if (location.pathname.startsWith('/plans/')) {
      title = 'Learning Plan'
    } else {
      title = 'StudyZone'
    }
  }

  const isWorkspace = location.pathname === '/ai-assistant'

  // Show onboarding modal only if user is logged in, profile is loaded, and onboarding_completed is strictly false
  const showOnboarding = Boolean(user && profile && profile.onboarding_completed === false)

  return (
    <SearchProvider>
      <div className={cn('relative flex min-h-svh bg-background overflow-x-hidden', isWorkspace && 'h-svh max-h-svh overflow-hidden')}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className={cn('relative z-10 flex min-w-0 flex-1 flex-col lg:pl-0', isWorkspace && 'h-full min-h-0 overflow-hidden')}>
          <Header
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <motion.main
            key={location.pathname}
            variants={pageEntrance}
            initial="hidden"
            animate="visible"
            className={cn(
              'flex-1',
              isWorkspace
                ? 'flex flex-col min-h-0 overflow-hidden p-3 sm:p-5 sm:pb-4'
                : 'overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8',
            )}
          >
            <Outlet />
          </motion.main>
        </div>

        {/* Global Command & Search Modal (Ctrl/Cmd+K) */}
        <GlobalSearchModal />

        {/* Global Background Ambient Audio Bar */}
        <GlobalAudioBar />

        {/* First-time Learner Onboarding Modal */}
        <LearnerOnboardingModal isOpen={showOnboarding} />
      </div>
    </SearchProvider>
  )
}
