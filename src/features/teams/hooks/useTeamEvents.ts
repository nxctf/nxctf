import { useMemo } from 'react'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'

export function useTeamEvents(startedEvents: any[], solvedEventIds: string[], hasMainSolved: boolean, selectedEvent: string | number) {
  const solvedEventSet = useMemo(
    () => new Set((solvedEventIds || []).map((id) => String(id))),
    [solvedEventIds]
  )

  const teamEvents = useMemo(
    () => startedEvents.filter((ev) => solvedEventSet.has(String(ev.id))),
    [startedEvents, solvedEventSet]
  )

  const { settings } = useSystemSettings()
  const showMainOption = hasMainSolved && !settings.disable_default_challenges

  const effectiveSelectedEvent = useMemo(() => {
    const allowed = new Set<string>(['all'])
    if (showMainOption) allowed.add('main')
    for (const ev of teamEvents) allowed.add(String(ev.id))

    const val = allowed.has(String(selectedEvent)) ? selectedEvent : 'all'
    return String(val)
  }, [selectedEvent, showMainOption, teamEvents])

  return {
    teamEvents,
    showMainOption,
    effectiveSelectedEvent
  }
}
