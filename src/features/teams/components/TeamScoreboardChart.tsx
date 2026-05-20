'use client'

import BaseScoreboardChart, { type ChartSeries } from '@/features/scoreboard/components/base/BaseScoreboardChart'
import { TeamProgressSeries } from '../types'

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

function adjustDate(dateStr: string) {
  const date = new Date(dateStr)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

interface TeamScoreboardChartProps {
  series: TeamProgressSeries[]
  scoreLabel?: string
}

export default function TeamScoreboardChart({ series, scoreLabel = 'Score' }: TeamScoreboardChartProps) {
  const chartSeries: ChartSeries[] = series.slice(0, 10).map(entry => ({
    name: truncate(entry.team_name, 16),
    data: entry.history.map(p => ({ date: adjustDate(p.date), score: p.score })),
  }))

  return <BaseScoreboardChart title="Top 10 Teams" series={chartSeries} yAxisTitle={scoreLabel} />
}
