import TeamScoreboardPage from '@/features/teams/components/TeamScoreboardPage'
import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'

export default function TeamScoreboardRoutePage() {
  return (
    <AppSidebarShell
      title="Team Scoreboard"
      subtitle="Team ranking and competition standings."
      sidebar={
        <AppPageSidebar
          title="Team Scoreboard"
          description="Compare team performance across active events."
          links={[
            { href: '/teams/scoreboard', label: 'Team Rank', description: 'Team standings.' },
            { href: '/scoreboard', label: 'User Rank', description: 'Individual standings.' },
            { href: '/teams', label: 'Teams', description: 'Manage your team.' },
          ]}
        />
      }
      mobileSidebarTitle="Team Scoreboard"
    >
      <TeamScoreboardPage />
    </AppSidebarShell>
  )
}
