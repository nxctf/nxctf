import { useState, useEffect, useRef } from 'react'
import { TeamService, TeamScoreboardEntry as TeamScoreboardEntryService } from '@/features/teams/services/team.service'
import { buildScoreboard, getOrderedProgressSeries } from '@/features/scoreboard/lib/build-scoreboard'
import { TeamScoreboardEntry, TeamProgressSeries } from '../types'

export function useTeamScoreboard(user: any, showTotalScore: boolean, selectedEvent: string | number) {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<TeamScoreboardEntry[]>([])
  const [series, setSeries] = useState<TeamProgressSeries[]>([])
  const [currentTeamName, setCurrentTeamName] = useState<string | null>(null)
  const entriesCountRef = useRef(0)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const isFirstLoad = entriesCountRef.current === 0
      if (isFirstLoad) setLoading(true)

      const p_event_id = (selectedEvent === 'all' || selectedEvent === 'main') ? null : String(selectedEvent)
      const p_event_mode = selectedEvent === 'all' ? 'any' : selectedEvent === 'main' ? 'main' : 'event'

      const [{ entries: data, error: scoreboardError }, teamResult] = await Promise.all([
        TeamService.getTeamScoreboard(250, 0, p_event_id, p_event_mode),
        TeamService.getMyTeam(p_event_id, p_event_mode),
      ])

      setCurrentTeamName(teamResult.team?.name ?? null)

      if (scoreboardError) {
        entriesCountRef.current = 0
        setEntries([])
        setSeries([])
        if (isFirstLoad) setLoading(false)
        return
      }

      const scoreKey = showTotalScore ? 'total_score' : 'unique_score'
      const result = buildScoreboard(data || [], {
        nameKey: 'team_name',
        scoreKey,
        filterZero: true,
        limit: 250
      })

      // Preserve original structure for UI compatibility
      const teamEntries: TeamScoreboardEntry[] = result.entries.map((e) => {
        const original = (data || []).find((o: TeamScoreboardEntryService) => o.team_name === e.username)
        return {
          ...original,
          team_id: e.id,
          team_name: e.username,
          [scoreKey]: e.score
        } as TeamScoreboardEntry
      })

      entriesCountRef.current = teamEntries.length
      setEntries(teamEntries)

      const progressData = showTotalScore
        ? await TeamService.getTopTeamProgressByNames(result.topNames, p_event_id, p_event_mode)
        : await TeamService.getTopTeamUniqueProgressByNames(result.topNames, p_event_id, p_event_mode)

      setSeries(getOrderedProgressSeries(result.topNames, progressData) as TeamProgressSeries[])

      if (isFirstLoad) setLoading(false)
    }
    fetchData()
  }, [user, showTotalScore, selectedEvent])

  return {
    loading,
    entries,
    series,
    currentTeamName,
  }
}
