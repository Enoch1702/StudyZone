import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicRoute } from './components/auth/PublicRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoadingState } from './components/ui/LoadingSpinner'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Route-level code splitting via dynamic imports
const LandingPage = lazy(() => import('./pages/LandingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const FocusPage = lazy(() => import('./pages/FocusPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'))
const LearningAnalyticsPage = lazy(() => import('./pages/LearningAnalyticsPage'))
const LearningPlansPage = lazy(() => import('./pages/LearningPlansPage'))
const LearningPlanDetailPage = lazy(() => import('./pages/LearningPlanDetailPage'))
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'))
const TasksPage = lazy(() => import('./pages/TasksPage'))
const DeadlinesPage = lazy(() => import('./pages/DeadlinesPage'))
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))

function SuspenseFallback() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <LoadingState message="Loading StudyZone..." />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Authentication Routes */}
              <Route element={<PublicRoute />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
              </Route>

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="focus" element={<FocusPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="flashcards" element={<FlashcardsPage />} />
                  <Route path="analytics" element={<LearningAnalyticsPage />} />
                  <Route path="plans" element={<LearningPlansPage />} />
                  <Route path="plans/:planId" element={<LearningPlanDetailPage />} />
                  {/* Defensive Alias Routes for Learning Plans */}
                  <Route path="learning-plans" element={<Navigate to="/plans" replace />} />
                  <Route path="learning-plans/:planId" element={<Navigate to="/plans/:planId" replace />} />
                  <Route path="subjects" element={<SubjectsPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="deadlines" element={<DeadlinesPage />} />
                  <Route path="ai-assistant" element={<AIAssistantPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
