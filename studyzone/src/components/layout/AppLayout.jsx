import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { pageEntrance } from '../../lib/motion'

const pageTitles = {
  '/': 'Dashboard',
  '/subjects': 'Subjects',
  '/tasks': 'Tasks',
  '/deadlines': 'Deadlines',
  '/ai-assistant': 'AI Study Assistant',
  '/settings': 'Settings',
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'StudyZone'

  return (
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
    </div>
  )
}
