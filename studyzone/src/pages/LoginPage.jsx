import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowRight, GraduationCap, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { bannerVariant, fadeUp } from '../lib/motion'

export default function LoginPage() {
  const { signIn, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const rawFrom = location.state?.from?.pathname
  const from = rawFrom && rawFrom !== '/' ? rawFrom : '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.')
      return
    }
    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    try {
      setSubmitting(true)
      const { error } = await signIn({ email, password })

      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          setErrorMessage('Invalid email or password. Please double-check your credentials.')
        } else if (error.message?.includes('Email not confirmed')) {
          setErrorMessage('Your email address has not been confirmed yet. Please check your inbox.')
        } else {
          setErrorMessage(error.message || 'Failed to sign in. Please try again.')
        }
        return
      }

      navigate(from, { replace: true })
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8 overflow-hidden">
      {/* Ambient decorative gradient blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-400/12 blur-3xl" />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md space-y-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Sign in to access your study plans, notes, and focus timer.
          </p>
        </div>

        {/* Configuration Warning Banner if variables missing */}
        {!isConfigured && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <p className="font-semibold">Supabase environment variables not configured.</p>
            <p className="mt-0.5 text-warning/90">
              Please set <code className="rounded bg-black/30 px-1 py-0.5 font-mono">VITE_SUPABASE_URL</code> and <code className="rounded bg-black/30 px-1 py-0.5 font-mono">VITE_SUPABASE_ANON_KEY</code> in <code className="font-mono">.env.local</code>.
            </p>
          </div>
        )}

        {/* Auth Card */}
        <div className="rounded-2xl border border-border/85 bg-gradient-to-b from-surface via-surface to-surface-raised/40 p-6 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)] sm:p-8 transition-all duration-200 hover:border-border">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  variants={bannerVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex-1 leading-relaxed">{errorMessage}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-foreground"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-foreground"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full gap-2 mt-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted">
            <span>Don&apos;t have an account? </span>
            <Link
              to="/signup"
              state={{ from: location.state?.from }}
              className="font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
