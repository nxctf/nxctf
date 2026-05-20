import { ScoreboardEntry, ScoreboardProgressMap, ScoreboardResult, ScoreboardEventParam } from '../types'

/**
 * Normalizes event selection into a parameter for API calls.
 */
export function getScoreboardEventParam(selectedEvent: string | number): ScoreboardEventParam {
  if (selectedEvent === 'main') return null
  if (selectedEvent === 'all') return 'all'
  return String(selectedEvent)
}

/**
 * Normalizes and ranks scoreboard data.
 * Pure function - No side effects.
 */
export function buildScoreboard(
  rows: any[],
  options: {
    nameKey: string
    scoreKey: string
    limit?: number
    filterZero?: boolean
    progressMap?: ScoreboardProgressMap
  }
): ScoreboardResult {
  const { nameKey, scoreKey, limit, filterZero, progressMap } = options

  // 1. Sort by score
  let processed = [...rows].sort((a, b) => (b[scoreKey] ?? 0) - (a[scoreKey] ?? 0))

  // 2. Filter zero scores if requested
  if (filterZero) {
    processed = processed.filter((row) => (row[scoreKey] ?? 0) > 0)
  }

  // 3. Slice for limit
  if (limit) {
    processed = processed.slice(0, limit)
  }

  // 4. Map to standardized entries
  const entries: ScoreboardEntry[] = processed.map((row, index) => {
    const name = row[nameKey]
    const score = row[scoreKey] ?? 0
    const history = progressMap?.[name]?.history ?? []

    const entry: ScoreboardEntry = {
      id: String(row.id || row.team_id || index + 1),
      username: name,
      score: score,
      rank: index + 1,
      progress: history.map(p => ({
        date: String(p.date),
        score: p.score
      }))
    }

    // Sync score with last progress point if available (optional sanity check)
    if (history.length > 0) {
      const lastScore = history.at(-1)?.score ?? 0
      entry.score = Math.max(entry.score, lastScore)
    }

    return entry
  })

  // 5. Extract top names (e.g. for charts)
  const topNames = entries.slice(0, 10).map((e) => e.username)

  return {
    entries,
    topNames
  }
}

/**
 * Normalizes progress history from a map into an ordered array based on rankings.
 */
export function getOrderedProgressSeries(
  topNames: string[],
  progressMap: ScoreboardProgressMap
) {
  return topNames
    .map((name) => progressMap[name])
    .filter(Boolean)
}

/**
 * Checks if a leaderboard is effectively empty (no scores or progress).
 */
export function isScoreboardEmpty(entries: ScoreboardEntry[]) {
  if (entries.length === 0) return true
  const hasProgress = entries.some((e) => (e.progress?.length ?? 0) > 0)
  const hasScore = entries.some((e) => (e.score ?? 0) > 0)
  return !(hasProgress || hasScore)
}
