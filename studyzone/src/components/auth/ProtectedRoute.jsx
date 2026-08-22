import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { GraduationCap } from 'lucide-react'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted border border-accent/20">
            <GraduationCap className="h-6 w-6 text-accent" />
          </div>
          <div className="flex items-center gap-2.5">
            <LoadingSpinner size="sm" />
            <span className="text-sm font-medium text-muted">Checking session...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
