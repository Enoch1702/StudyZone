import { Card } from '../ui/Card'
import { AIStudyForm, AIStudyFormHeader } from '../ai/AIStudyForm'

export function AIStudyCard() {
  return (
    <Card className="flex h-full flex-col border-accent/15 p-0">
      <div className="border-b border-border-subtle px-4 py-4 sm:px-5">
        <AIStudyFormHeader compact />
      </div>
      <div className="flex-1 p-4 sm:p-5">
        <AIStudyForm compact />
      </div>
    </Card>
  )
}
