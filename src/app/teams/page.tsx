import TeamsPage from '@/features/teams/components/TeamsPage'
import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'

export default function TeamsRoutePage() {
  return (
    <AppSidebarShell
      title="Teams"
      subtitle="Team management and collaboration workspace."
      sidebar={
        <AppPageSidebar
          title="Teams"
          description="Manage roster, invites, and event-based collaboration."
          links={[
            { href: '/teams', label: 'Team Workspace', description: 'Roster and settings.' },
            { href: '/teams/scoreboard', label: 'Team Rank', description: 'Competition standings.' },
            { href: '/scoreboard', label: 'User Rank', description: 'Individual standings.' },
          ]}
        />
      }
      mobileSidebarTitle="Teams"
    >
      <TeamsPage />
    </AppSidebarShell>
  )
}
