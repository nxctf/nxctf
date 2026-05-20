import LogsPageContent from '@/features/logs/components/LogsPageContent'
import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'

export default function LogsRoutePage() {
  return (
    <AppSidebarShell
      title="Activity Logs"
      subtitle="System and challenge activity logs overview."
      sidebar={
        <AppPageSidebar
          title="Logs"
          description="Review recent activity and challenge solve events."
          links={[
            { href: '/logs', label: 'Activity Logs', description: 'Latest system activity.' },
            { href: '/scoreboard', label: 'Scoreboard', description: 'Ranking context.' },
            { href: '/challenges', label: 'Challenges', description: 'Source of solve events.' },
          ]}
        />
      }
      mobileSidebarTitle="Logs"
    >
      <LogsPageContent />
    </AppSidebarShell>
  )
}
