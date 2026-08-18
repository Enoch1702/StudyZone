import { BookOpen, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { SubjectCard } from '../components/subjects/SubjectCard'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import { subjects } from '../data/mockData'

export default function SubjectsPage() {
  return (
    <PageContainer width="wide" className="space-y-5">
      <PageHeader
        description="Organize your courses and track progress across subjects."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add your first subject to organize tasks, deadlines, and track course progress in one place."
          actionLabel="Add Subject"
          onAction={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
