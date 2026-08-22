import { useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, LogOut, Moon, User } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { useAuth } from '../context/useAuth'

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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure deadline and task reminders</CardDescription>
        </CardHeader>
        <div className="space-y-2">
          {[
            'Email reminders for upcoming deadlines',
            'Daily task summary',
            'Weekly productivity report',
          ].map((label) => (
            <label
              key={label}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-border-subtle bg-surface-raised/50 px-4 py-3"
            >
              <span className="text-sm text-foreground">{label}</span>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-border accent-accent"
              />
            </label>
          ))}
        </div>
      </Card>

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
