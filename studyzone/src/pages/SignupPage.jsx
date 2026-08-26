import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowRight, CheckCircle2, GraduationCap, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { bannerVariant, fadeUp } from '../lib/motion'

export default function SignupPage() {
  const { signUp, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmationNeeded, setConfirmationNeeded] = useState(false)

  const rawFrom = location.state?.from?.pathname
  const from = rawFrom && rawFrom !== '/' ? rawFrom : '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.')
      return
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and re-type.')
      return
    }

    try {
      setSubmitting(true)
      const { data, error, needsEmailConfirmation } = await signUp({
        email,
        password,
        fullName,
      })

      if (error) {
        if (error.message?.includes('User already registered')) {
          setErrorMessage('An account with this email already exists. Please sign in instead.')
        } else {
          setErrorMessage(error.message || 'Failed to create account. Please try again.')
        }
        return
      }

      if (needsEmailConfirmation) {
        setConfirmationNeeded(true)
        return
      }

      if (data?.session) {
        navigate(from, { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Confirmation email sent state
  if (confirmationNeeded) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-6"
        >
          <div className="rounded-xl border border-border bg-surface p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted border border-accent/20">
              <CheckCircle2 className="h-6 w-6 text-accent" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">Confirm your email</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              We&apos;ve sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>.
              Please check your inbox to activate your account and start using StudyZone.
            </p>
            <div className="mt-6 border-t border-border pt-4">
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Return to Sign in
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted border border-accent/20">
            <GraduationCap className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Join StudyZone to organize your courses, tasks, and deadlines.
          </p>
        </div>

        {/* Configuration Warning Banner if variables missing */}
        {!isConfigured && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <p className="font-semibold">Supabase environment variables not configured.</p>
            <p className="mt-0.5 text-warning/90">
              Please set <code className="rounded bg-black/30 px-1 py-0.5 font-mono">VITE_SUPABASE_URL</code> and <code className="rounded bg-black/30 px-1 py-0.5 font-mono">VITE_SUPABASE_ANON_KEY</code> in <code className="font-mono">.env.local</code>.
            </p>
          </div>
        )}

        {/* Auth Card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8 transition-all duration-200 hover:border-border/80">
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

            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-name"
                className="block text-xs font-medium text-foreground"
              >
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9"
                  autoComplete="name"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block text-xs font-medium text-foreground"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-email"
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
              <label
                htmlFor="signup-password"
                className="block text-xs font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="new-password"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-medium text-foreground"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="new-password"
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted">
            <span>Already have an account? </span>
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
