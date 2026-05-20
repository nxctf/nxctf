'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Rocket, Sparkles, Trophy } from 'lucide-react'
import Loader from '@/shared/components/Loader'
import EmptyState from '@/shared/components/EmptyState'
import PageBackground from '@/shared/components/PageBackground'
import { SegmentedTabs } from '@/shared/components'
import { Card, CardContent } from '@/shared/ui/card'
import { APP } from '@/config'
import { useAuth } from '@/shared/contexts/AuthContext'
import { EventProvider, useEventContext } from '@/features/events/contexts/EventContext'
import EventSelect from '@/features/events/components/EventSelect'
import TeamScoreboardChart from './TeamScoreboardChart'
import TeamScoreboardTable from './TeamScoreboardTable'
import { useTeamScoreboard } from '../hooks/useTeamScoreboard'
import { cn } from '@/shared/lib/utils'

function TeamScoreboardPageInner() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { startedEvents, selectedEvent, setSelectedEvent } = useEventContext()
  const [showTotalScore, setShowTotalScore] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  const { loading, entries, series, currentTeamName } = useTeamScoreboard(user, showTotalScore, selectedEvent)

  if (authLoading) return <Loader fullscreen color="text-blue-500" />
  if (!user) return null

  const scoreLabel = showTotalScore ? 'Total Score' : 'Unique Score'

  return (
    <PageBackground
      selectionClassName="selection:bg-primary/30"
      contentClassName={cn('relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', 'space-y-4 py-4 sm:py-6')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-auto">
          <EventSelect
            value={String(selectedEvent)}
            onChange={setSelectedEvent}
            events={startedEvents}
            className="w-full max-w-full sm:w-45"
            getEventLabel={(event) => String(event.name ?? event.title ?? 'Untitled')}
          />
        </div>

        <SegmentedTabs
          items={[
            { value: 'unique', label: 'Unique Score', icon: Sparkles },
            ...(!APP.teams.hidescoreboardTotal
              ? [{ value: 'total' as const, label: 'Total Score', icon: Coins }]
              : []),
          ]}
          value={showTotalScore ? 'total' : 'unique'}
          onChange={(tab) => setShowTotalScore(tab === 'total')}
          variant="panel"
          className="w-full sm:w-fit"
          stretch
        />
      </div>

      <div key={`${showTotalScore}-${selectedEvent}`} className="space-y-6">
        {series.length > 0 && !showTotalScore && (
          <TeamScoreboardChart series={series} scoreLabel={scoreLabel} />
        )}

        {loading && entries.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader color="text-blue-500" />
          </div>
        ) : entries.length === 0 ? (
          <Card className="bg-card border border-border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40">
            <CardContent>
              <EmptyState
                icon={<Trophy className="w-full h-full text-blue-500" />}
                title="No teams on the board yet."
                description={
                  <>
                    No team submissions yet for this event. Start solving challenges with your team!
                    <Rocket size={14} className="inline-block ml-1 text-blue-400/70" />
                  </>
                }
                containerHeight="py-12"
              />
            </CardContent>
          </Card>
        ) : (
          <TeamScoreboardTable
            entries={entries}
            showTotalScore={showTotalScore}
            currentTeamName={currentTeamName}
          />
        )}
      </div>
    </PageBackground>
  )
}

export default function TeamScoreboardPage() {
  return (
    <EventProvider>
      <TeamScoreboardPageInner />
    </EventProvider>
  )
}
