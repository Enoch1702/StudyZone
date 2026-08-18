import { PageContainer } from '../components/layout/PageContainer'
import { WelcomeSection } from '../components/dashboard/WelcomeSection'
import { StatsGrid } from '../components/dashboard/StatsGrid'
import { TodaysFocus } from '../components/dashboard/TodaysFocus'
import { UpcomingDeadlinesList } from '../components/dashboard/UpcomingDeadlinesList'
import { ProductivityChart } from '../components/dashboard/ProductivityChart'
import { AIStudyCard } from '../components/dashboard/AIStudyCard'

export default function DashboardPage() {
  return (
    <PageContainer width="wide" className="space-y-5">
      <WelcomeSection />
      <StatsGrid />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TodaysFocus />
        <UpcomingDeadlinesList />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProductivityChart />
        </div>
        <div className="lg:col-span-2">
          <AIStudyCard />
        </div>
      </div>
    </PageContainer>
  )
}
