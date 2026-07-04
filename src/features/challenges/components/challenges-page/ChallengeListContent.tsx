'use client'

import { Lock } from 'lucide-react'
import APP from '@/config'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
import { EmptyState, PageLoader } from '@/shared/components'
import type { ChallengeWithSolve } from '@/shared/types'
import type { ChallengeFilterSettings, EventSelectorValue } from '../../types'
import { CHALLENGE_LAYOUT_MODES, type ChallengeLayoutMode } from '../../lib'
import ChallengeCard from '../ChallengeCard'
import ChallengeEmptyState from './ChallengeEmptyState'

type ChallengeListContentProps = {
  initialLoading: boolean
  eventMembershipLoading: boolean
  eventMembershipEventId?: string | null
  eventId: EventSelectorValue
  eventJoinBlocked: boolean
  filteredChallenges: ChallengeWithSolve[]
  challenges: ChallengeWithSolve[]
  sortedFilteredChallenges: ChallengeWithSolve[]
  grouped: Record<string, ChallengeWithSolve[]>
  orderedKeys: string[]
  layoutMode: ChallengeLayoutMode
  filterSettings: ChallengeFilterSettings
  selectedEventObj: unknown
  selectedEventStart: Date | null
  selectedEventNotStarted: boolean
  selectedEventEnded: boolean
  nowDate: Date
  formatRemaining: (ms: number) => string
  onOpenChallenge: (challenge: ChallengeWithSolve) => void
}

export default function ChallengeListContent({
  initialLoading,
  eventMembershipLoading,
  eventMembershipEventId,
  eventId,
  eventJoinBlocked,
  filteredChallenges,
  challenges,
  sortedFilteredChallenges,
  grouped,
  orderedKeys,
  layoutMode,
  filterSettings,
  selectedEventObj,
  selectedEventStart,
  selectedEventNotStarted,
  selectedEventEnded,
  nowDate,
  formatRemaining,
  onOpenChallenge,
}: ChallengeListContentProps) {
  const { settings } = useSystemSettings()

  if (initialLoading) {
    return <PageLoader />
  }

  if (eventMembershipLoading && eventMembershipEventId !== eventId) {
    return <PageLoader />
  }

  if (eventJoinBlocked) {
    return (
      <EmptyState
        icon={<Lock className="w-full h-full" />}
        title="Access Restricted"
        description="Please join the event to unlock these challenges."
        containerHeight="py-16"
      />
    )
  }

  if (filteredChallenges.length === 0) {
    return (
      <ChallengeEmptyState
        eventId={eventId}
        selectedEventObj={selectedEventObj}
        selectedEventStart={selectedEventStart}
        selectedEventNotStarted={selectedEventNotStarted}
        selectedEventEnded={selectedEventEnded}
        nowDate={nowDate}
        challengesCount={challenges.length}
        formatRemaining={formatRemaining}
      />
    )
  }

  if (layoutMode === CHALLENGE_LAYOUT_MODES.COMPACT) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 auto-rows-max">
        {sortedFilteredChallenges.map((challenge) => (
          <div
            key={challenge.id}
            className="challenge-card-reveal relative w-full overflow-visible"
          >
            <ChallengeCard
              challenge={challenge}
              highlightTeamSolves={filterSettings.highlightTeamSolves}
              onOpenChallenge={onOpenChallenge}
            />
          </div>
        ))}
      </div>
    )
  }

  if (layoutMode === CHALLENGE_LAYOUT_MODES.CATEGORY_COMPACT) {
    const categoryOrderedChallenges = orderedKeys.flatMap((category) => grouped[category] ?? [])

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 auto-rows-max">
        {categoryOrderedChallenges.map((challenge) => (
          <div
            key={challenge.id}
            className="challenge-card-reveal relative w-full overflow-visible"
          >
            <ChallengeCard
              challenge={challenge}
              highlightTeamSolves={filterSettings.highlightTeamSolves}
              onOpenChallenge={onOpenChallenge}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {orderedKeys.map((category) => {
        const categoryChallenges = grouped[category] ?? []

        if (categoryChallenges.length === 0) return null

        return (
          <div
            key={category}
            className="mb-8 relative z-0"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              <div className="w-1.5 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                {eventId === 'all' && String(category).toLowerCase() === 'intro'
                  ? `Intro (${String(settings.event_main_label || 'Main')})`
                  : category}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 auto-rows-max">
              {categoryChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="challenge-card-reveal relative w-full overflow-visible"
                >
                  <ChallengeCard
                    challenge={challenge}
                    highlightTeamSolves={filterSettings.highlightTeamSolves}
                    onOpenChallenge={onOpenChallenge}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}
