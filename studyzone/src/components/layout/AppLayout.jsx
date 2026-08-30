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

  // Show onboarding modal only if user is logged in, profile is loaded, and onboarding_completed is strictly false
  const showOnboarding = Boolean(user && profile && profile.onboarding_completed === false)

  return (
    <SearchProvider>
      <div className="relative flex min-h-svh bg-background overflow-x-hidden">
        {/* Ambient background mesh gradient blurs for light/dark depth */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-400/12 via-indigo-400/8 to-transparent blur-3xl" />
          <div className="absolute top-1/3 -left-32 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-sky-400/10 via-purple-400/6 to-transparent blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-indigo-400/8 via-blue-300/6 to-transparent blur-3xl" />
        </div>

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:pl-0">
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

        {/* Global Background Ambient Audio Bar */}
        <GlobalAudioBar />

        {/* First-time Learner Onboarding Modal */}
        <LearnerOnboardingModal isOpen={showOnboarding} />
      </div>
    </SearchProvider>
  )
}
