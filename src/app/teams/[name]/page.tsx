import TeamDetailPage from '@/features/teams/components/TeamDetailPage'
import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'

export default function TeamDetailRoutePage() {
  return (
    <AppSidebarShell
      title="Team"
      subtitle="Team details, roster, and management."
      sidebar={
        <AppPageSidebar
          title="Team"
          description="View roster, participation, and team-related navigation."
          links={[
            { href: '/teams', label: 'Teams', description: 'Workspace overview.' },
            { href: '/teams/scoreboard', label: 'Team Rank', description: 'Competition standings.' },
            { href: '/scoreboard', label: 'User Rank', description: 'Individual standings.' },
          ]}
        />
      }
      mobileSidebarTitle="Team"
    >
      <TeamDetailPage />
    </AppSidebarShell>
  )
}
