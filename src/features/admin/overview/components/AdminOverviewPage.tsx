"use client"

import { Loader } from '@/shared/components'
import AuditLogList from './AuditLogList'
import OverviewStatsCards from './OverviewStatsCards'
import StatsGraph from './StatsGraph'
import { useAdminOverviewData } from '../hooks/useAdminOverviewData'
import { AdminPageShell, AdminDashboardSection, AdminDashboardStack } from '../../shared/components'

export default function AdminOverviewPage() {
  const {
    user,
    authLoading,
    isLoading,
    challenges,
    siteInfo,
    timeRange,
    activityData,
    refreshStats,
  } = useAdminOverviewData()

  if (authLoading || isLoading) return <Loader fullscreen />
  if (!user) return null

  return (
    <AdminPageShell>
      <AdminDashboardStack>
        <OverviewStatsCards siteInfo={siteInfo} challengeCount={challenges.length} />

        <AdminDashboardSection
          title="Activity Overview"
          description="Traffic and solve activity over selected range."
        >
          <StatsGraph
            data={activityData}
            range={timeRange}
            onRangeChange={refreshStats}
          />
        </AdminDashboardSection>

        <AuditLogList />
      </AdminDashboardStack>
    </AdminPageShell>
  )
}
