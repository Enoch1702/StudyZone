import { useState } from 'react'
import {
  AlertCircle,
  Bell,
  Brain,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  LogOut,
  Moon,
  Sliders,
  Sparkles,
  User,
} from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { useAuth } from '../context/useAuth'
import { LEARNER_TYPES, PRIMARY_GOALS } from '../lib/learnerProfile'
import { updateLearnerProfile, updateNotificationPreferences } from '../services/learnerProfileService'
import { supabase } from '../lib/supabase'

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  return `"${str.replace(/"/g, '""')}"`
}

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
      <PageHeader
        title="Settings & Preferences"
        description="Manage your profile, learning preferences, alerts, and data archives."
        icon={Sliders}
      />

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
              Email is managed securely by Supabase authentication.
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

      {/* Data Portability & Complete Export */}
      <DataExportSettingsCard />

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
            className="gap-2 cursor-pointer"
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
 * Settings card for complete JSON and CSV data export.
 */
function DataExportSettingsCard() {
  const { user } = useAuth()
  const [exportingJson, setExportingJson] = useState(false)
  const [exportingTasksCsv, setExportingTasksCsv] = useState(false)
  const [exportingSessionsCsv, setExportingSessionsCsv] = useState(false)
  const [exportingCardsCsv, setExportingCardsCsv] = useState(false)
  const [exportSuccess, setExportSuccess] = useState('')

  function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ─── 1. Full JSON Backup (All User Tables Scoped to auth.uid()) ───
  async function handleExportJson() {
    if (!user?.id) return
    setExportingJson(true)
    setExportSuccess('')

    try {
      const [
        profRes, subRes, taskRes, deadRes, sessRes,
        planRes, milRes, notifRes, convRes, msgRes,
        deckRes, cardRes, revRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subjects').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('deadlines').select('*').eq('user_id', user.id),
        supabase.from('study_sessions').select('*').eq('user_id', user.id),
        supabase.from('learning_plans').select('*').eq('user_id', user.id),
        supabase.from('learning_milestones').select('*').eq('user_id', user.id),
        supabase.from('notifications').select('*').eq('user_id', user.id),
        supabase.from('ai_conversations').select('*').eq('user_id', user.id),
        supabase.from('ai_messages').select('*').eq('user_id', user.id),
        supabase.from('flashcard_decks').select('*').eq('user_id', user.id),
        supabase.from('flashcards').select('*').eq('user_id', user.id),
        supabase.from('flashcard_reviews').select('*').eq('user_id', user.id),
      ])

      const backupData = {
        studyzone_export_version: '1.2',
        exported_at: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email,
        profile: profRes.data || null,
        subjects: subRes.data || [],
        tasks: taskRes.data || [],
        deadlines: deadRes.data || [],
        study_sessions: sessRes.data || [],
        learning_plans: planRes.data || [],
        learning_milestones: milRes.data || [],
        notifications: notifRes.data || [],
        ai_conversations: convRes.data || [],
        ai_messages: msgRes.data || [],
        flashcard_decks: deckRes.data || [],
        flashcards: cardRes.data || [],
        flashcard_reviews: revRes.data || [],
      }

      const jsonStr = JSON.stringify(backupData, null, 2)
      const ts = new Date().toISOString().slice(0, 10)
      triggerDownload(jsonStr, `studyzone_backup_${ts}.json`, 'application/json')

      setExportSuccess('Full JSON backup downloaded successfully.')
      setTimeout(() => setExportSuccess(''), 4000)
    } catch (err) {
      console.warn('JSON export failed:', err)
    } finally {
      setExportingJson(false)
    }
  }

  // ─── 2. Export Tasks (CSV) ────────────────────────────────────
  async function handleExportTasksCsv() {
    if (!user?.id) return
    setExportingTasksCsv(true)
    setExportSuccess('')

    try {
      const [taskRes, subRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('subjects').select('*').eq('user_id', user.id),
      ])

      const subMap = new Map((subRes.data || []).map((s) => [s.id, s.name]))
      const tasks = taskRes.data || []

      const headers = ['ID', 'Title', 'Subject', 'Priority', 'Status', 'Due Date', 'Est Minutes', 'Created At', 'Completed At']
      const rows = tasks.map((t) => [
        escapeCsvField(t.id),
        escapeCsvField(t.title),
        escapeCsvField(subMap.get(t.subject_id) || ''),
        escapeCsvField(t.priority),
        escapeCsvField(t.status),
        escapeCsvField(t.due_date || ''),
        escapeCsvField(t.estimated_minutes || 0),
        escapeCsvField(t.created_at),
        escapeCsvField(t.completed_at || ''),
      ])

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const ts = new Date().toISOString().slice(0, 10)
      triggerDownload(csvContent, `studyzone_tasks_${ts}.csv`, 'text/csv;charset=utf-8;')

      setExportSuccess('Tasks CSV downloaded.')
      setTimeout(() => setExportSuccess(''), 4000)
    } finally {
      setExportingTasksCsv(false)
    }
  }

  // ─── 3. Export Study Sessions (CSV) ───────────────────────────
  async function handleExportSessionsCsv() {
    if (!user?.id) return
    setExportingSessionsCsv(true)
    setExportSuccess('')

    try {
      const [sessRes, subRes] = await Promise.all([
        supabase.from('study_sessions').select('*').eq('user_id', user.id),
        supabase.from('subjects').select('*').eq('user_id', user.id),
      ])

      const subMap = new Map((subRes.data || []).map((s) => [s.id, s.name]))
      const sessions = sessRes.data || []

      const headers = ['ID', 'Started At', 'Ended At', 'Duration Minutes', 'Subject', 'Notes']
      const rows = sessions.map((s) => [
        escapeCsvField(s.id),
        escapeCsvField(s.started_at),
        escapeCsvField(s.ended_at || ''),
        escapeCsvField(s.duration_minutes || 0),
        escapeCsvField(subMap.get(s.subject_id) || ''),
        escapeCsvField(s.notes || ''),
      ])

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const ts = new Date().toISOString().slice(0, 10)
      triggerDownload(csvContent, `studyzone_sessions_${ts}.csv`, 'text/csv;charset=utf-8;')

      setExportSuccess('Study Sessions CSV downloaded.')
      setTimeout(() => setExportSuccess(''), 4000)
    } finally {
      setExportingSessionsCsv(false)
    }
  }

  // ─── 4. Export Flashcards (CSV) ───────────────────────────────
  async function handleExportCardsCsv() {
    if (!user?.id) return
    setExportingCardsCsv(true)
    setExportSuccess('')

    try {
      const [cardRes, deckRes] = await Promise.all([
        supabase.from('flashcards').select('*').eq('user_id', user.id),
        supabase.from('flashcard_decks').select('*').eq('user_id', user.id),
      ])

      const deckMap = new Map((deckRes.data || []).map((d) => [d.id, d.title]))
      const cards = cardRes.data || []

      const headers = ['ID', 'Deck', 'Front', 'Back', 'Easiness Factor', 'Interval Days', 'Repetitions', 'Next Review Date']
      const rows = cards.map((c) => [
        escapeCsvField(c.id),
        escapeCsvField(deckMap.get(c.deck_id) || ''),
        escapeCsvField(c.front),
        escapeCsvField(c.back),
        escapeCsvField(c.easiness_factor),
        escapeCsvField(c.interval_days),
        escapeCsvField(c.repetitions),
        escapeCsvField(c.next_review_at || ''),
      ])

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const ts = new Date().toISOString().slice(0, 10)
      triggerDownload(csvContent, `studyzone_flashcards_${ts}.csv`, 'text/csv;charset=utf-8;')

      setExportSuccess('Flashcards CSV downloaded.')
      setTimeout(() => setExportSuccess(''), 4000)
    } finally {
      setExportingCardsCsv(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-accent" />
          <CardTitle>Data Portability & Archives</CardTitle>
        </div>
        <CardDescription>
          Export your complete learning history, flashcards, and AI chat archives anytime.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        {exportSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Full JSON Backup */}
          <button
            type="button"
            disabled={exportingJson}
            onClick={handleExportJson}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-accent/40 bg-accent/10 hover:bg-accent/15 transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <FileJson className="h-5 w-5 text-accent mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-foreground">JSON Backup</span>
            <span className="text-[10px] text-muted mt-0.5">All tables & AI chats</span>
          </button>

          {/* Tasks CSV */}
          <button
            type="button"
            disabled={exportingTasksCsv}
            onClick={handleExportTasksCsv}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-border/80 bg-surface-raised/40 hover:bg-surface-raised transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="h-5 w-5 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-foreground">Tasks (CSV)</span>
            <span className="text-[10px] text-muted mt-0.5">Spreadsheet format</span>
          </button>

          {/* Sessions CSV */}
          <button
            type="button"
            disabled={exportingSessionsCsv}
            onClick={handleExportSessionsCsv}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-border/80 bg-surface-raised/40 hover:bg-surface-raised transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <Download className="h-5 w-5 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-foreground">Sessions (CSV)</span>
            <span className="text-[10px] text-muted mt-0.5">Study log history</span>
          </button>

          {/* Flashcards CSV */}
          <button
            type="button"
            disabled={exportingCardsCsv}
            onClick={handleExportCardsCsv}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-border/80 bg-surface-raised/40 hover:bg-surface-raised transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <Brain className="h-5 w-5 text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-foreground">Cards (CSV)</span>
            <span className="text-[10px] text-muted mt-0.5">Flashcard decks</span>
          </button>
        </div>
      </div>
    </Card>
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
          <CardTitle>In-App Notification Alerts</CardTitle>
        </div>
        <CardDescription>
          Configure which in-app reminders and milestone alerts appear in your notification bell.
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
              <p className="text-[11px] text-muted mt-0.5">In-app bell alerts when exams or assignments are due within 48 hours.</p>
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
              <p className="text-[11px] text-muted mt-0.5">In-app reminders when high-priority tasks pass their due date.</p>
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
              <p className="text-[11px] text-muted mt-0.5">Evening in-app reminders to log study sessions and maintain your active streak.</p>
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
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
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
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
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
