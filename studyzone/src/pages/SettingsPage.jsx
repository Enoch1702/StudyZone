import { useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, LogOut, Moon, Sparkles, User } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { useAuth } from '../context/useAuth'
import { LEARNER_TYPES, PRIMARY_GOALS } from '../lib/learnerProfile'
import { updateLearnerProfile, updateNotificationPreferences } from '../services/learnerProfileService'

export default function SettingsPage() {
  const { profile, user, updateProfile, signOut } = useAuth()

  const defaultName = profile?.full_name || user?.user_metadata?.full_name || ''
  const [fullName, setFullName] = useState(defaultName)
  const [prevDefaultName, setPrevDefaultName] = useState(defaultName)

  if (defaultName !== prevDefaultName) {
    setPrevDefaultName(defaultName)
    setFullName(defaultName)
  }

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const email = profile?.email || user?.email || ''

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess(false)

    if (!fullName.trim()) {
      setSaveError('Full name cannot be empty.')
      return
    }

    try {
      setSaving(true)
      const { error } = await updateProfile({ fullName })
      if (error) {
        setSaveError(error.message || 'Failed to update profile.')
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      setSaveError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer width="narrow" className="space-y-5">
      <PageHeader description="Manage your profile and application preferences." />

      {/* Profile Name & Email Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Profile updated successfully.</span>
            </div>
          )}

          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div>
            <label htmlFor="settings-name" className="mb-1.5 block text-xs font-medium text-muted">
              Full name
            </label>
            <Input
              id="settings-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="settings-email" className="mb-1.5 block text-xs font-medium text-muted">
              Email
            </label>
            <Input
              id="settings-email"
              type="email"
              value={email}
              disabled
              className="opacity-75 cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Email is managed by Supabase authentication.
            </p>
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </form>
      </Card>

      {/* Learner Profile & Goals */}
      <LearnerProfileSettingsCard />

      {/* In-App Notification Alert Preferences */}
      <NotificationPreferencesCard />

      {/* Theme & Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Theme and display settings</CardDescription>
        </CardHeader>
        <p className="text-sm text-muted">
          Dark mode is enabled by default. Light mode will be available in a future update.
        </p>
      </Card>

      {/* Account Session & Sign Out */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4 text-danger" />
            <CardTitle className="text-danger">Account Session</CardTitle>
          </div>
          <CardDescription>Sign out of your active session on this device</CardDescription>
        </CardHeader>
        <div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => signOut()}
            className="gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </Button>
        </div>
      </Card>
    </PageContainer>
  )
}

/**
 * Settings card for in-app notification alert preferences.
 */
function NotificationPreferencesCard() {
  const { profile, user, refreshProfile } = useAuth()

  const [deadlineReminders, setDeadlineReminders] = useState(
    profile?.notify_deadline_reminders ?? true,
  )
  const [dailyTaskSummary, setDailyTaskSummary] = useState(
    profile?.notify_daily_task_summary ?? true,
  )
  const [weeklyReport, setWeeklyReport] = useState(
    profile?.notify_weekly_report ?? true,
  )

  const [prevProfileUpdated, setPrevProfileUpdated] = useState(profile?.updated_at)
  if (profile && profile.updated_at !== prevProfileUpdated) {
    setPrevProfileUpdated(profile.updated_at)
    setDeadlineReminders(profile.notify_deadline_reminders ?? true)
    setDailyTaskSummary(profile.notify_daily_task_summary ?? true)
    setWeeklyReport(profile.notify_weekly_report ?? true)
  }

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!user?.id) return
    setError('')
    setSuccess(false)

    try {
      setSaving(true)
      const res = await updateNotificationPreferences({
        userId: user.id,
        notifyDeadlineReminders: deadlineReminders,
        notifyDailyTaskSummary: dailyTaskSummary,
        notifyWeeklyReport: weeklyReport,
      })

      if (res.error) {
        setError(res.error.message || 'Failed to update preferences.')
      } else {
        await refreshProfile()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted" />
          <CardTitle>In-App Notifications & Alerts</CardTitle>
        </div>
        <CardDescription>
          Configure which reminders and alerts appear in your in-app notification bell.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSave} className="space-y-4">
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Notification preferences updated.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/40 p-3.5 hover:bg-surface-raised/70 transition-colors">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">Upcoming & Due Deadlines</p>
              <p className="text-[11px] text-muted mt-0.5">Alerts when exams or assignments are due within 48 hours.</p>
            </div>
            <input
              type="checkbox"
              checked={deadlineReminders}
              onChange={(e) => setDeadlineReminders(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/40 p-3.5 hover:bg-surface-raised/70 transition-colors">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">Overdue Task Alerts</p>
              <p className="text-[11px] text-muted mt-0.5">Reminders when high-priority tasks pass their due date.</p>
            </div>
            <input
              type="checkbox"
              checked={dailyTaskSummary}
              onChange={(e) => setDailyTaskSummary(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/40 p-3.5 hover:bg-surface-raised/70 transition-colors">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">Study Streak & Momentum Alerts</p>
              <p className="text-[11px] text-muted mt-0.5">Evening reminders to log study sessions and maintain your active streak.</p>
            </div>
            <input
              type="checkbox"
              checked={weeklyReport}
              onChange={(e) => setWeeklyReport(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
            />
          </label>
        </div>

        <Button type="submit" size="sm" disabled={saving}>
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </>
          ) : (
            'Save alert preferences'
          )}
        </Button>
      </form>
    </Card>
  )
}

/**
 * Settings card allowing users to configure learner category, primary goal, and learning focus.
 */
function LearnerProfileSettingsCard() {
  const { profile, user, refreshProfile } = useAuth()

  const defaultLearnerType = profile?.learner_type || 'college'
  const defaultPrimaryGoal = profile?.primary_goal || 'exams'
  const defaultLearningFocus = profile?.learning_focus || ''

  const [learnerType, setLearnerType] = useState(defaultLearnerType)
  const [primaryGoal, setPrimaryGoal] = useState(defaultPrimaryGoal)
  const [learningFocus, setLearningFocus] = useState(defaultLearningFocus)

  const [prevProfileId, setPrevProfileId] = useState(profile?.id)
  const [prevUpdated, setPrevUpdated] = useState(profile?.updated_at)

  if (profile && (profile.id !== prevProfileId || profile.updated_at !== prevUpdated)) {
    setPrevProfileId(profile.id)
    setPrevUpdated(profile.updated_at)
    setLearnerType(defaultLearnerType)
    setPrimaryGoal(defaultPrimaryGoal)
    setLearningFocus(defaultLearningFocus)
  }

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!user?.id) return
    setError('')
    setSuccess(false)

    try {
      setSaving(true)
      const res = await updateLearnerProfile({
        userId: user.id,
        learnerType,
        primaryGoal,
        learningFocus: learningFocus.trim() || null,
        onboardingCompleted: true,
      })

      if (res.error) {
        setError(res.error.message || 'Failed to update learner profile.')
      } else {
        await refreshProfile()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <CardTitle>Learner Profile & Goals</CardTitle>
        </div>
        <CardDescription>
          Customize your learning category to personalize dashboard messaging and AI guidance.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSave} className="space-y-4">
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Learner profile updated successfully.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="settings-learner-type" className="mb-1.5 block text-xs font-medium text-muted">
            Learning Category
          </label>
          <select
            id="settings-learner-type"
            value={learnerType}
            onChange={(e) => setLearnerType(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {LEARNER_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="settings-primary-goal" className="mb-1.5 block text-xs font-medium text-muted">
            Primary Goal
          </label>
          <select
            id="settings-primary-goal"
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {PRIMARY_GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="settings-learning-focus" className="mb-1.5 block text-xs font-medium text-muted">
            Current Focus / Key Topics
          </label>
          <Input
            id="settings-learning-focus"
            value={learningFocus}
            onChange={(e) => setLearningFocus(e.target.value)}
            placeholder="e.g. Java, NEET Biology, DSA, React, GATE..."
            disabled={saving}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Informs your AI Study Assistant and Dashboard about what you are actively studying.
          </p>
        </div>

        <Button type="submit" size="sm" disabled={saving}>
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </>
          ) : (
            'Save preferences'
          )}
        </Button>
      </form>
    </Card>
  )
}
