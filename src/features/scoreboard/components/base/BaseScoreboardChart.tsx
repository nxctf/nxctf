'use client'

import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import BaseScoreboardCard from './BaseScoreboardCard'

const SERIES_COLORS = [
  '#60a5fa', '#34d399', '#f472b6', '#fb923c', '#a78bfa',
  '#facc15', '#4ade80', '#f87171', '#22d3ee', '#c084fc',
]

export type ChartSeries = {
  name: string
  data: { date: string; score: number }[]
}

type BaseScoreboardChartProps = {
  title: string
  series: ChartSeries[]
  yAxisTitle?: string
}

function buildChartData(series: ChartSeries[]) {
  const allDates = new Set<string>()
  series.forEach(s => s.data.forEach(p => allDates.add(p.date)))
  const sortedDates = [...allDates].sort()

  return sortedDates.map(date => {
    const point: Record<string, string | number | undefined> = { date }
    series.forEach(s => {
      const pts = s.data.filter(p => p.date <= date)
      if (pts.length > 0) point[s.name] = pts[pts.length - 1].score
    })
    return point
  })
}

export default function BaseScoreboardChart({ title, series, yAxisTitle = 'Score' }: BaseScoreboardChartProps) {
  const chartData = buildChartData(series)

  const config: ChartConfig = Object.fromEntries(
    series.map((s, i) => [s.name, { label: s.name, color: SERIES_COLORS[i % SERIES_COLORS.length] }])
  )

  return (
    <BaseScoreboardCard
      title={title}
      headerClassName="justify-center border-b-0 pb-1"
      titleClassName="text-center"
      contentClassName="px-3 pt-0 sm:px-5"
    >
      <ChartContainer config={config} className="h-75 w-full">
        <LineChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(0, 10)}
            minTickGap={50}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            width={44}
            label={{ value: yAxisTitle, angle: -90, position: 'insideLeft', fontSize: 10, offset: 10 }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(v) => String(v).slice(0, 16)}
              />
            }
          />
          <Legend
            content={({ payload }) => (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
                {payload?.map((entry, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="inline-block h-2 w-3 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                    {entry.value}
                  </span>
                ))}
              </div>
            )}
          />
          {series.map((s, i) => (
            <Line
              key={s.name}
              type="stepAfter"
              dataKey={s.name}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </BaseScoreboardCard>
  )
}
