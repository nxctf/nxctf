"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Target } from 'lucide-react'

import EventSelect from '@/features/events/components/EventSelect'
import { useEventContext } from '@/features/events/contexts/EventContext'
import Loader from '@/shared/components/Loader'
import PageBackground from '@/shared/components/PageBackground'
import { SegmentedTabs } from '@/shared/components'
import { useAuth } from '@/shared/contexts/AuthContext'
import LogsList from './LogsList'
import { useLogs } from '../contexts/LogsContext'

export default function LogsPageContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { markAllRead, refresh } = useLogs()
  const [tabType, setTabType] = useState<'challenges' | 'solves'>('solves')
  const { startedEvents, selectedEvent, setSelectedEvent } = useEventContext()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (!authLoading && user) {
      refresh()
    }
  }, [authLoading, user, router, refresh]);

  useEffect(() => {
    if (tabType === 'challenges' && user) {
      markAllRead(selectedEvent)
    }
  }, [tabType, user, markAllRead, selectedEvent]);

  if (authLoading) return <Loader fullscreen />;
  if (!user) return null;

  return (
    <PageBackground
      selectionClassName={'selection:bg-primary/30'}
      contentClassName={`${'relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 py-3 sm:py-4'} space-y-5`}
    >
      {/* Compact Navigation Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Event Filter */}
        <div className="flex items-center gap-3">
          <EventSelect
            value={selectedEvent}
            onChange={setSelectedEvent}
            events={startedEvents as any}
            className="min-w-[180px]"
            getEventLabel={(ev: any) => String(ev?.name ?? ev?.title ?? 'Untitled')}
          />
        </div>

        {/* Tab Switcher */}
        <SegmentedTabs
          items={[
            { value: 'solves', label: 'Solves Feed', icon: Target },
            { value: 'challenges', label: 'Challenge Info', icon: Flag },
          ]}
          value={tabType}
          onChange={setTabType}
          variant="panel"
        />
      </div>

      <div
        key={`${tabType}-${selectedEvent}`}
      >
        <LogsList tabType={tabType} eventId={selectedEvent} />
      </div>
    </PageBackground>
  );
}
