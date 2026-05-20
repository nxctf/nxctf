import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'
import { Card, CardContent } from '@/shared/ui/card'

export default function RulesPage() {
  return (
    <AppSidebarShell
      title="Rules"
      subtitle="Read platform rules and fair-play guidance."
      sidebar={
        <AppPageSidebar
          title="Rules"
          description="Keep competition behavior clear and fair."
          links={[
            { href: '/rules', label: 'Rules', description: 'Fair-play guidance.' },
            { href: '/info', label: 'Info', description: 'Platform details.' },
            { href: '/challenges', label: 'Challenges', description: 'Back to tasks.' },
          ]}
        />
      }
      mobileSidebarTitle="Rules"
    >
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Platform rules and guidelines coming soon.
        </CardContent>
      </Card>
    </AppSidebarShell>
  )
}
