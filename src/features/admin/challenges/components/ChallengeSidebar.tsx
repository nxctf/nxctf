import React from 'react'
import ChallengeOverviewCard from './ChallengeOverviewCard'
import RecentSolversList from './RecentSolversList'
import type { Challenge, SiteInfo, SolverRow } from '../types'

interface ChallengeSidebarProps {
  challenges: Challenge[]
  solvers: SolverRow[]
  siteInfo: SiteInfo | null
  isGlobalAdmin: boolean
  onViewAllSolvers: () => void
}

const ChallengeSidebar: React.FC<ChallengeSidebarProps> = ({
  challenges,
  solvers,
  siteInfo,
  isGlobalAdmin,
  onViewAllSolvers,
}) => {
  return (
    <aside className="lg:col-span-1 order-2 lg:order-none space-y-6 sticky top-0">
      <ChallengeOverviewCard
        challenges={challenges}
        info={isGlobalAdmin ? (siteInfo || undefined) : undefined}
        showViewAll={isGlobalAdmin}
      />
      <RecentSolversList solvers={solvers} onViewAll={onViewAllSolvers} />
    </aside>
  )
}

export default ChallengeSidebar
