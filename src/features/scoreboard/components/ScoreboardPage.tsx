'use client'

import Link from 'next/link'
import { Coins, Droplet, Rocket, Trophy } from 'lucide-react'
import Loader from '@/shared/components/Loader'
import EmptyState from '@/shared/components/EmptyState'
import PageBackground from '@/shared/components/PageBackground'
import { SegmentedTabs } from '@/shared/components'
import { Card, CardContent } from '@/shared/ui/card'
import { EventProvider } from '@/features/events/contexts/EventContext'
import EventSelect from '@/features/events/components/EventSelect'
import { useScoreboardPageData } from '../hooks'
import ScoreboardChart from './ScoreboardChart'
import ScoreboardTable from './ScoreboardTable'
import ScoreboardScopeTabs from './ScoreboardScopeTabs'
import { cn } from '@/shared/lib/utils'

function ScoreboardPageInner() {
  const {
    user,
    authLoading,
    leaderboard,
    loading,
    firstBloodMode,
    setFirstBloodMode,
    view,
    setView,
    startedEvents,
    selectedEvent,
    setSelectedEvent,
    hasMounted,
    stableLeaderboard,
    isEmpty,
    eventParam,
    recentSolvesMap,
  } = useScoreboardPageData()

  if (authLoading) return <Loader fullscreen />
  if (!user) return null

  const isAllView = view === 'all'

  return (
    <PageBackground
      selectionClassName="selection:bg-primary/30"
      contentClassName={cn('relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', 'space-y-4 py-4 sm:py-6')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <ScoreboardScopeTabs view={view} onViewChange={setView} />

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block mx-1" />

          <div className="w-full sm:w-45">
            <EventSelect
              value={selectedEvent}
              onChange={setSelectedEvent}
              events={startedEvents}
              className="w-full"
              getEventLabel={(event: any) => String(event?.name ?? event?.title ?? 'Untitled')}
            />
          </div>
        </div>

        <SegmentedTabs
          items={[
            { value: 'points', label: 'Points', icon: Coins },
            { value: 'first-blood', label: 'First Blood', icon: Droplet },
          ]}
          value={firstBloodMode ? 'first-blood' : 'points'}
          onChange={(tab) => setFirstBloodMode(tab === 'first-blood')}
          variant="panel"
          className="w-full sm:w-fit"
          stretch
        />
      </div>

      {loading && leaderboard.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader color="text-blue-500" />
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity duration-500 ${hasMounted ? '' : 'opacity-0'}`}>
          {!isAllView && stableLeaderboard.length > 0 && !isEmpty && (
            <ScoreboardChart leaderboard={stableLeaderboard.length > 0 ? stableLeaderboard : leaderboard} />
          )}

          {isEmpty ? (
            <Card className="bg-card border border-border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40">
              <CardContent>
                <EmptyState
                  icon={<Trophy className="w-full h-full text-blue-500" />}
                  title="No challenges solved yet."
                  description={
                    <>
                      No submissions yet for this event. Start solving challenges and claim the top spot.
                      <Rocket size={14} className="inline-block ml-1 text-blue-400/70" />
                    </>
                  }
                  containerHeight="py-12"
                  action={
                    <Link
                      href="/challenges"
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 bg-primary hover:bg-primary/90"
                    >
                      Explore Challenges
                    </Link>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <ScoreboardTable
              leaderboard={leaderboard}
              currentUsername={user?.username}
              eventId={eventParam}
              scoreColumnLabel={firstBloodMode ? 'First Blood' : undefined}
              scoreColumnRenderer={(entry) => entry.score}
              onShowAll={isAllView ? undefined : () => setView('all')}
              missingLabel={isAllView ? 'Not ranked yet' : 'Not in top 100'}
              recentSolvesMap={recentSolvesMap}
            />
          )}
        </div>
      )}
    </PageBackground>
  )
}

export default function ScoreboardPage() {
  return (
    <EventProvider>
      <ScoreboardPageInner />
    </EventProvider>
  )
}
