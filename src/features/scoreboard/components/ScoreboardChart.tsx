'use client'

import { LeaderboardEntry } from '@/shared/types'
import BaseScoreboardChart, { type ChartSeries } from './base/BaseScoreboardChart'

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

function adjustDate(dateStr: string) {
  const date = new Date(dateStr)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function ScoreboardChart({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  const series: ChartSeries[] = leaderboard.slice(0, 10).map(entry => ({
    name: truncate(entry.username, 16),
    data: entry.progress.map(p => ({ date: adjustDate(p.date), score: p.score })),
  }))

  return <BaseScoreboardChart title="Top 10 Users" series={series} />
}
