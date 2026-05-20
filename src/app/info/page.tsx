import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'
import { Card, CardContent } from '@/shared/ui/card'

export default function InfoPage() {
  return (
    <AppSidebarShell
      title="Platform Info"
      subtitle="Project details, contributors, and platform metadata."
      sidebar={
        <AppPageSidebar
          title="Platform Info"
          description="Read documentation and platform references."
          links={[
            { href: '/info', label: 'Info', description: 'Platform details.' },
            { href: '/rules', label: 'Rules', description: 'Fair-play policy.' },
            { href: '/challenges', label: 'Challenges', description: 'Main workspace.' },
          ]}
        />
      }
      mobileSidebarTitle="Platform Info"
    >
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Platform information and documentation coming soon.
        </CardContent>
      </Card>
    </AppSidebarShell>
  )
}
