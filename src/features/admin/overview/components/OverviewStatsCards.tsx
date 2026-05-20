import React from 'react'
import { Card, CardContent } from '@/shared/ui'
import { ADMIN_CARD_PLAIN_CLASS } from '@/features/admin/ui'
import type { SiteInfo } from '../types'

interface OverviewStatsCardsProps {
  siteInfo: SiteInfo | null
  challengeCount: number
}

const OverviewStatsCards: React.FC<OverviewStatsCardsProps> = ({ siteInfo, challengeCount }) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className={ADMIN_CARD_PLAIN_CLASS}>
        <CardContent className="pt-4">
          <div className="text-2xl font-semibold mb-1">{siteInfo?.total_users || 0}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </CardContent>
      </Card>
      <Card className={ADMIN_CARD_PLAIN_CLASS}>
        <CardContent className="pt-4">
          <div className="text-2xl font-semibold mb-1">{siteInfo?.total_solves || 0}</div>
          <div className="text-sm text-muted-foreground">Total Solves</div>
        </CardContent>
      </Card>
      <Card className={ADMIN_CARD_PLAIN_CLASS}>
        <CardContent className="pt-4">
          <div className="text-2xl font-semibold mb-1">{challengeCount}</div>
          <div className="text-sm text-muted-foreground">Total Challenges</div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OverviewStatsCards
