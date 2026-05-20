'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Lock } from 'lucide-react'
import APP from '@/config'
import { Loader, EmptyState } from '@/shared/components'
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

const INITIAL_CHALLENGE_RENDER_COUNT = 28
const CHALLENGE_RENDER_CHUNK_SIZE = 36
const CHALLENGE_REVEAL_DELAY_STEP_MS = 28
const CHALLENGE_REVEAL_DELAY_LIMIT = 12

function getChallengeRevealStyle(index: number): CSSProperties {
  return {
    '--challenge-reveal-delay': `${Math.min(index, CHALLENGE_REVEAL_DELAY_LIMIT) * CHALLENGE_REVEAL_DELAY_STEP_MS}ms`,
  } as CSSProperties
}

function scheduleChallengeRender(callback: () => void) {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 120 })
    return () => window.cancelIdleCallback(id)
  }

  const id = globalThis.setTimeout(callback, 60)
  return () => globalThis.clearTimeout(id)
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
  const categoryOrderedChallenges = useMemo(
    () => orderedKeys.flatMap((category) => grouped[category] ?? []),
    [grouped, orderedKeys]
  )
  const totalVisibleChallenges = layoutMode === CHALLENGE_LAYOUT_MODES.COMPACT
    ? sortedFilteredChallenges.length
    : categoryOrderedChallenges.length
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(INITIAL_CHALLENGE_RENDER_COUNT, totalVisibleChallenges)
  )

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_CHALLENGE_RENDER_COUNT, totalVisibleChallenges))
  }, [layoutMode, orderedKeys, sortedFilteredChallenges, totalVisibleChallenges])

  useEffect(() => {
    if (visibleCount >= totalVisibleChallenges) return

    return scheduleChallengeRender(() => {
      setVisibleCount((current) =>
        Math.min(current + CHALLENGE_RENDER_CHUNK_SIZE, totalVisibleChallenges)
      )
    })
  }, [totalVisibleChallenges, visibleCount])

  if (initialLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader color="text-primary" />
      </div>
    )
  }

  if (eventMembershipLoading && eventMembershipEventId !== eventId) {
    return (
      <div className="flex justify-center py-10">
        <Loader color="text-primary" />
      </div>
    )
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
    const visibleChallenges = sortedFilteredChallenges.slice(0, visibleCount)

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 auto-rows-max">
        {visibleChallenges.map((challenge, index) => (
          <div
            key={challenge.id}
            className="challenge-card-reveal relative w-full overflow-visible"
            style={getChallengeRevealStyle(index)}
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
    const visibleChallenges = categoryOrderedChallenges.slice(0, visibleCount)

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 auto-rows-max">
        {visibleChallenges.map((challenge, index) => (
          <div
            key={challenge.id}
            className="challenge-card-reveal relative w-full overflow-visible"
            style={getChallengeRevealStyle(index)}
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

  let remainingVisibleChallenges = visibleCount

  return (
    <>
      {orderedKeys.map((category) => {
        const categoryChallenges = grouped[category] ?? []
        const categoryVisibleCount = Math.min(
          categoryChallenges.length,
          Math.max(remainingVisibleChallenges, 0)
        )
        const visibleChallenges = categoryChallenges.slice(0, categoryVisibleCount)
        remainingVisibleChallenges -= categoryVisibleCount

        if (visibleChallenges.length === 0) return null

        return (
          <div
            key={category}
            className="relative z-0 mb-10"
          >
            <div className="mb-5 flex items-center gap-3 border-b border-border pb-3">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-lg font-black tracking-tight text-foreground md:text-xl">
                {eventId === 'all' && String(category).toLowerCase() === 'intro'
                  ? `Intro (${String(APP.eventMainLabel || 'Main')})`
                  : category}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 auto-rows-max">
              {visibleChallenges.map((challenge, index) => (
                <div
                  key={challenge.id}
                  className="challenge-card-reveal relative w-full overflow-visible"
                  style={getChallengeRevealStyle(index)}
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
