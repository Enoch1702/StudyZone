import { Bell, Moon, User } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { mockUserProfile } from '../data/mockData'

export default function SettingsPage() {
  const { displayName, email } = mockUserProfile

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
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted">
              Full name
            </label>
            <Input id="name" defaultValue={displayName} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
              Email
            </label>
            <Input id="email" type="email" defaultValue={email} />
          </div>
          <Button size="sm">Save changes</Button>
        </div>
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
    </PageContainer>
  )
}
