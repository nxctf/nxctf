import type { LeaderboardEntry } from '@/shared/types'

export type ScoreboardEventParam = string | null | 'all'

export interface LeaderboardSummaryRow {
  username: string
  score?: number | null
}

export interface ScoreboardProgressPoint {
  date: string
  score: number
  challenge_title?: string | null
  challenge_category?: string | null
}

export interface ScoreboardProgressHistory {
  history?: ScoreboardProgressPoint[] | null
}

export type ScoreboardProgressMap = Record<string, ScoreboardProgressHistory>

export interface ScoreboardEntry extends LeaderboardEntry {
  // We can add more specific fields if needed, but it should be compatible with LeaderboardEntry
}

export interface ScoreboardResult {
  entries: ScoreboardEntry[]
  topNames: string[]
}
