import ScoreboardPage from '@/features/scoreboard/components/ScoreboardPage'
import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'

export default function ScoreboardRoutePage() {
  return (
    <AppSidebarShell
      title="Scoreboard"
      subtitle="Team and user ranking overview."
      sidebar={
        <AppPageSidebar
          title="Scoreboard"
          description="Switch ranking views, events, and scoring modes from the scoreboard controls."
          links={[
            { href: '/scoreboard', label: 'User Scoreboard', description: 'Individual rankings.' },
            { href: '/teams/scoreboard', label: 'Team Scoreboard', description: 'Team standings.' },
            { href: '/challenges', label: 'Challenges', description: 'Solve more tasks.' },
          ]}
        />
      }
      mobileSidebarTitle="Scoreboard"
    >
      <ScoreboardPage />
    </AppSidebarShell>
  )
}
