'use client'

import { BarChart3, LayoutGrid, TrendingUp, Zap } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/ui/chart'
import { ChallengeWithSolve } from '@/shared/types'
import { UserEmptyState, UserSection } from '../ui'

const PIE_COLORS = ['#60a5fa', '#3b82f6', '#2563eb', '#93c5fd', '#1d4ed8', '#bfdbfe', '#1e40af', '#dbeafe']
const getPieColor = (index: number): string => PIE_COLORS[index % PIE_COLORS.length] ?? 'var(--primary)'

type Props = {
  solvedChallenges: ChallengeWithSolve[]
  firstBloodIds: string[]
}

function groupBy(items: ChallengeWithSolve[], key: (item: ChallengeWithSolve) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item)
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

function groupSolvesOverTime(solved: ChallengeWithSolve[]) {
  const map: Record<string, number> = {}
  solved.forEach(s => {
    if (!s.solved_at) return
    const d = s.solved_at.slice(0, 10)
    map[d] = (map[d] || 0) + 1
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
}

export default function UserStats({ solvedChallenges, firstBloodIds }: Props) {
  if (!solvedChallenges?.length) {
    return (
      <UserEmptyState
        icon={BarChart3}
        title="No stat data available"
        description="Solve some challenges to see stats here."
      />
    )
  }

  const byCategory = groupBy(solvedChallenges, s => s.category || 'Uncategorized')
  const byDifficulty = groupBy(solvedChallenges, s => s.difficulty || 'Unknown')
  const timeSeries = groupSolvesOverTime(solvedChallenges)
  const firstBloodCount = firstBloodIds.length

  const catData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  const diffData = Object.entries(byDifficulty).map(([name, value]) => ({ name, value }))

  const catConfig: ChartConfig = Object.fromEntries(
    catData.map((d, i) => [d.name, { label: d.name, color: getPieColor(i) }])
  )
  const diffConfig: ChartConfig = Object.fromEntries(
    diffData.map((d, i) => [d.name, { label: d.name, color: getPieColor(i) }])
  )
  const timeConfig: ChartConfig = { count: { label: 'Solves', color: '#60a5fa' } }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserSection
          title="Solves by Category"
          description={`${catData.length} categories`}
          icon={LayoutGrid}
        >
          <ChartContainer config={catConfig} className="h-60 w-full">
            <PieChart>
              <Pie
                data={catData}
                dataKey="value"
                nameKey="name"
                innerRadius="40%"
                outerRadius="70%"
                paddingAngle={2}
                label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {catData.map((_, i) => (
                  <Cell key={i} fill={getPieColor(i)} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            </PieChart>
          </ChartContainer>
        </UserSection>

        <UserSection
          title="Solves by Difficulty"
          description={`${diffData.length} difficulty level${diffData.length !== 1 ? 's' : ''}`}
          icon={Zap}
        >
          <ChartContainer config={diffConfig} className="h-60 w-full">
            <PieChart>
              <Pie
                data={diffData}
                dataKey="value"
                nameKey="name"
                innerRadius="40%"
                outerRadius="70%"
                paddingAngle={2}
                label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {diffData.map((_, i) => (
                  <Cell key={i} fill={getPieColor(i)} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            </PieChart>
          </ChartContainer>
        </UserSection>
      </div>

      <UserSection
        title="Solves Over Time"
        description={`${firstBloodCount} first blood${firstBloodCount !== 1 ? 's' : ''}`}
        icon={TrendingUp}
      >
        <ChartContainer config={timeConfig} className="h-64 w-full">
          <AreaChart data={timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
            <YAxis tick={{ fontSize: 10 }} width={30} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#fillCount)"
              dot={{ r: 3, fill: '#60a5fa' }}
            />
          </AreaChart>
        </ChartContainer>
      </UserSection>
    </div>
  )
}
