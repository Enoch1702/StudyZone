import { Bot, Clock, ListChecks } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { AIStudyForm, AIStudyFormHeader } from '../components/ai/AIStudyForm'

const capabilities = [
  {
    icon: ListChecks,
    title: 'Structured study plans',
    description: 'Daily sessions with clear topic goals.',
  },
  {
    icon: Clock,
    title: 'Time-aware scheduling',
    description: 'Plans fit your available hours and deadlines.',
  },
  {
    icon: Bot,
    title: 'Subject-aware guidance',
    description: 'Recommendations based on your course load.',
  },
]

export default function AIAssistantPage() {
  return (
    <PageContainer width="medium">
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border-subtle px-5 py-5 sm:px-6">
          <AIStudyFormHeader />
        </div>
        <div className="px-5 py-5 sm:px-6">
          <AIStudyForm />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {capabilities.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-lg border border-border bg-surface px-4 py-3.5"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-raised">
                <Icon className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
