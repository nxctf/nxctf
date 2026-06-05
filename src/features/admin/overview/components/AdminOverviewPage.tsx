"use client"
import OverviewStatsCards from './OverviewStatsCards'
import ChallengeDistributionCard from './ChallengeDistributionCard'
import RecentSolvesCard from './RecentSolvesCard'
import StatsGraph from './StatsGraph'
import { useAdminOverviewData } from '../hooks/useAdminOverviewData'
import { AdminContentLoading, AdminFilterSelect, AdminPageShell, AdminPanel } from '../../ui'

export default function AdminOverviewPage() {
  const {
    user,
    authLoading,
    accessReady,
    isAllowed,
    isLoading,
    challenges,
    siteInfo,
    timeRange,
    activityData,
    recentSolves,
    refreshStats,
  } = useAdminOverviewData()

  if (authLoading || !accessReady) return <AdminContentLoading variant="overview" />
  if (!user || !isAllowed) return null

  if (isLoading) {
    return (
      <AdminPageShell>
        <AdminContentLoading variant="overview" />
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell>
      <div className="py-5 pt-7.5 space-y-5">
        <OverviewStatsCards siteInfo={siteInfo} challenges={challenges} />

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <AdminPanel
            title="Solve Activity"
            headerClassName="!h-14 !px-4 !py-0"
            contentClassName="!py-1 scroll-hidden"
            action={
              <AdminFilterSelect
                value={timeRange}
                defaultValue="7d"
                onValueChange={refreshStats}
                placeholder="Select timeframe"
                triggerClassName="h-8 sm:w-[130px]"
                options={[
                  { value: '7d', label: '7 Days' },
                  { value: '30d', label: '30 Days' },
                  { value: '90d', label: '90 Days' },
                ]}
              />
            }
          >
            <StatsGraph
              data={activityData}
              range={timeRange}
            />
          </AdminPanel>

          <RecentSolvesCard solves={recentSolves} />
        </div>

        <ChallengeDistributionCard challenges={challenges} />
      </div>
    </AdminPageShell>
  )
}
