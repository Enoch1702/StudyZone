import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { SearchProvider } from '../../context/SearchContext'
import { GlobalSearchModal } from '../search/GlobalSearchModal'
import { LearnerOnboardingModal } from '../onboarding/LearnerOnboardingModal'
import { useAuth } from '../../context/useAuth'
import { pageEntrance } from '../../lib/motion'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/': 'Dashboard',
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

  // Show onboarding modal only if user is logged in, profile is loaded, and onboarding_completed is strictly false
  const showOnboarding = Boolean(user && profile && profile.onboarding_completed === false)

  return (
    <SearchProvider>
      <div className="flex min-h-svh bg-background">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
          <Header
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <motion.main
            key={location.pathname}
            variants={pageEntrance}
            initial="hidden"
            animate="visible"
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8"
          >
            <Outlet />
          </motion.main>
        </div>

        {/* Global Command & Search Modal (Ctrl/Cmd+K) */}
        <GlobalSearchModal />

        {/* First-time Learner Onboarding Modal */}
        <LearnerOnboardingModal isOpen={showOnboarding} />
      </div>
    </SearchProvider>
  )
}
