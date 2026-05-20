'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'
import type { ActivityPoint, TimeRange } from '../types'

const chartConfig: ChartConfig = {
  solves: { label: 'Solves', color: '#6366f1' },
  activeUsers: { label: 'Active Users', color: '#22c55e' },
}

interface StatsGraphProps {
  data: ActivityPoint[]
  range: TimeRange
  onRangeChange: (range: TimeRange) => void
}

export default function StatsGraph({ data, range, onRangeChange }: StatsGraphProps) {
  return (
    <div>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
        <div>
          <h3 className="text-xl font-semibold">Activity Trends</h3>
          <p className="text-sm text-muted-foreground mt-1">Track solves and active users over time</p>
        </div>
        <Select value={range} onValueChange={onRangeChange}>
          <SelectTrigger className="w-35 h-8">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border">
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="pt-6">
        <ChartContainer config={chartConfig} className="h-87.5 w-full">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillSolves" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillActiveUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'rgb(156,163,175)' }}
              tickLine={false}
              axisLine={false}
              minTickGap={range === '7d' ? 20 : range === '30d' ? 30 : 50}
              tickFormatter={(v: string) => {
                const d = new Date(v)
                return range === '90d'
                  ? d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
                  : d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'rgb(156,163,175)' }}
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="solves"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#fillSolves)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="activeUsers"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#fillActiveUsers)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
