'use client'

import APP from '@/config'
import type { useChallengesPageData } from '../../hooks/useChallengesPageData'
import ChallengeFilterBar from '../ChallengeFilterBar'
import ChallengeListContent from './ChallengeListContent'

type ChallengesPageData = ReturnType<typeof useChallengesPageData>

type ChallengesTabPanelProps = {
  data: ChallengesPageData
}

export default function ChallengesTabPanel({
  data,
}: ChallengesTabPanelProps) {
  return (
    <div className="min-w-0 space-y-4 2xl:space-y-5 [will-change:transform]">
        <section className="rounded-2xl border border-border bg-card px-6 py-6 md:px-8 md:py-7 shadow-xs">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Challenges
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Browse and solve challenges across all categories.
          </p>
        </section>

        <ChallengeFilterBar
          filters={data.filters}
          events={data.enrichedEvents}
          selectedEventId={data.eventId}
          onEventChange={data.attemptEventSelect}
          sortMode={data.sortMode}
          onSortModeChange={() => data.setSortMode((prev) => prev === 'default' ? 'newest' : 'default')}
          hideMainEventOption={APP.hideEventMain}
          showSearch={false}
          showStatusFilter={false}
          settings={data.filterSettings}
          categories={data.categories}
          difficulties={data.difficulties}
          onFilterChange={data.setFilters}
          onSettingsChange={data.setFilterSettings}
          onClear={() => data.setFilters({ status: 'all', category: 'all', difficulty: 'all', search: '', feature: 'N' })}
          hideSidebarFiltersOnDesktop
        />

        <div
          data-tour="challenge-list"
          data-challenge-list-anchor
          className="min-w-0 rounded-2xl border border-border bg-card/80 p-4 md:p-5"
        >
          <ChallengeListContent
            initialLoading={data.initialLoading}
            eventMembershipLoading={data.eventMembershipLoading}
            eventMembershipEventId={data.eventMembership?.event_id}
            eventId={data.eventId}
            eventJoinBlocked={data.eventJoinBlocked}
            filteredChallenges={data.filteredChallenges}
            challenges={data.challenges}
            sortedFilteredChallenges={data.sortedFilteredChallenges}
            grouped={data.grouped}
            orderedKeys={data.orderedKeys}
            layoutMode={data.layoutMode}
            filterSettings={data.filterSettings}
            selectedEventObj={data.selectedEventObj}
            selectedEventStart={data.selectedEventStart}
            selectedEventNotStarted={data.selectedEventNotStarted}
            selectedEventEnded={data.selectedEventEnded}
            nowDate={data.nowDate}
            formatRemaining={data.formatRemaining}
            onOpenChallenge={data.openChallenge}
          />
        </div>
    </div>
  )
}
