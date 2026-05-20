import { SectionIntro } from '@/features/landing/components/SectionIntro'
import { PageContainer } from '@/shared/components/PageContainer'
import { Card, CardContent } from '@/shared/ui/card'
import { ShieldAlert } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <SectionIntro
          icon={<ShieldAlert className="h-4 w-4 text-primary" />}
          title="Maintenance"
          description="Maintenance status and diagnostics."
        />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            System is currently under maintenance. Please check back later.
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
