'use client'

import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartData, ChartOptions, ChartType, Plugin, TooltipItem, TooltipPositionerFunction } from 'chart.js'

import BaseScoreboardCard from './BaseScoreboardCard'

type ScoreboardSolveMarker = {
  color: string
  dataIndex: number
  datasetIndex: number
  score: number
}

type ScoreboardOverlapSegment = {
  colors: string[]
  seriesIndices: number[]
  endIndex: number
  score: number
  startIndex: number
}

declare module 'chart.js' {
  interface Chart {
    $scoreboardRevealProgress?: number
    $scoreboardOverlapSegments?: ScoreboardOverlapSegment[]
    $scoreboardSolveMarkers?: ScoreboardSolveMarker[]
  }

  interface TooltipPositionerMap {
    offCenter: TooltipPositionerFunction<ChartType>
  }
}

const SERIES_COLORS = [
  '#60a5fa', '#34d399', '#f472b6', '#fb923c', '#a78bfa',
  '#facc15', '#4ade80', '#f87171', '#22d3ee', '#c084fc',
]

const clippedCharts = new WeakSet<ChartJS>()

export type ChartSeries = {
  name: string
  data: { date: string; score: number }[]
}

type BuiltChartPoint = {
  date: string
  [seriesName: string]: string | number | undefined
}

type BaseScoreboardChartProps = {
  title: string
  series: ChartSeries[]
  yAxisTitle?: string
  startDate?: string
}

const scoreboardRevealPlugin: Plugin<'line'> = {
  id: 'scoreboardRevealClip',
  beforeDatasetsDraw(chart) {
    const progress = chart.$scoreboardRevealProgress ?? 1
    if (progress >= 1) return

    const { ctx, chartArea } = chart
    if (!ctx || !chartArea) return

    const width = (chartArea.right - chartArea.left) * Math.max(0, progress)

    ctx.save()
    clippedCharts.add(chart)
    ctx.beginPath()
    ctx.rect(chartArea.left, chartArea.top, width, chartArea.bottom - chartArea.top)
    ctx.clip()
  },
  afterDatasetsDraw(chart) {
    if (!clippedCharts.has(chart)) return

    clippedCharts.delete(chart)
    chart.ctx?.restore()
  },
}

const scoreboardSolvePointPlugin: Plugin<'line'> = {
  id: 'scoreboardSolvePointMarkers',
  afterDatasetsDraw(chart) {
    const markers = chart.$scoreboardSolveMarkers
    if ((chart.$scoreboardRevealProgress ?? 1) < 1) return

    const { ctx, chartArea, scales } = chart
    const xScale = scales.x
    const yScale = scales.y
    if (!ctx || !chartArea || !xScale || !yScale) return

    const activePointKeys = new Set(
      chart.getActiveElements().map((element) => `${element.datasetIndex}:${element.index}`)
    )

    ctx.save()
    const lastDrawnXByDataset = new Map<number, number>()

    markers?.forEach((marker) => {
      if (!chart.isDatasetVisible(marker.datasetIndex)) return

      const x = xScale.getPixelForValue(marker.dataIndex)
      const y = yScale.getPixelForValue(marker.score)
      const isActive = activePointKeys.has(`${marker.datasetIndex}:${marker.dataIndex}`)

      if (x < chartArea.left || x > chartArea.right || y < chartArea.top || y > chartArea.bottom) {
        return
      }

      if (!isActive) {
        const lastX = lastDrawnXByDataset.get(marker.datasetIndex)
        if (lastX !== undefined && Math.abs(x - lastX) < 12) {
          return
        }
      }

      ctx.beginPath()
      ctx.arc(x, y, isActive ? 6 : 5.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(15,23,42,0.78)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, isActive ? 4.5 : 3.25, 0, Math.PI * 2)
      ctx.fillStyle = marker.color
      ctx.fill()
      if (!isActive) {
        ctx.lineWidth = 1.35
        ctx.strokeStyle = '#f8fafc'
        ctx.stroke()
        lastDrawnXByDataset.set(marker.datasetIndex, x)
      }
    })

    const labelCount = chart.data.labels?.length ?? 0
    const activeGroups = new Map<string, { color: string; dataIndex: number; datasetIndex: number; score: number }[]>()

    chart.getActiveElements().forEach((element) => {
      if (element.index === labelCount - 1) return
      if (!chart.isDatasetVisible(element.datasetIndex)) return

      const dataset = chart.data.datasets[element.datasetIndex]
      const rawValue = dataset?.data?.[element.index]
      if (typeof rawValue !== 'number' || rawValue <= 0) return

      const borderColor = dataset.borderColor
      const color = typeof borderColor === 'string'
        ? borderColor
        : SERIES_COLORS[element.datasetIndex % SERIES_COLORS.length]
      const key = `${element.index}:${rawValue}`
      const group = activeGroups.get(key) ?? []

      group.push({
        color,
        dataIndex: element.index,
        datasetIndex: element.datasetIndex,
        score: rawValue,
      })
      activeGroups.set(key, group)
    })

    activeGroups.forEach((group) => {
      const sortedGroup = [...group].sort((a, b) => a.datasetIndex - b.datasetIndex)
      const gap = sortedGroup.length > 5 ? 7 : 9
      const center = (sortedGroup.length - 1) / 2
      const x = xScale.getPixelForValue(sortedGroup[0].dataIndex)
      const baseY = yScale.getPixelForValue(sortedGroup[0].score)
      const centeredTop = baseY - center * gap
      const centeredBottom = baseY + center * gap
      let shiftY = 0

      if (centeredTop < chartArea.top + 7) {
        shiftY = chartArea.top + 7 - centeredTop
      } else if (centeredBottom > chartArea.bottom - 7) {
        shiftY = chartArea.bottom - 7 - centeredBottom
      }

      sortedGroup.forEach((marker, index) => {
        const y = baseY + shiftY + (index - center) * gap

        if (x < chartArea.left || x > chartArea.right || y < chartArea.top || y > chartArea.bottom) {
          return
        }

        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(15,23,42,0.78)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, 4.5, 0, Math.PI * 2)
        ctx.fillStyle = marker.color
        ctx.fill()
      })
    })
    ctx.restore()
  },
}

const scoreboardOverlapSegmentPlugin: Plugin<'line'> = {
  id: 'scoreboardOverlapSegments',
  afterDatasetsDraw(chart) {
    const segments = chart.$scoreboardOverlapSegments
    if (!segments?.length || (chart.$scoreboardRevealProgress ?? 1) < 1) return

    const { ctx, chartArea, scales } = chart
    const xScale = scales.x
    const yScale = scales.y
    if (!ctx || !chartArea || !xScale || !yScale) return

    ctx.save()
    segments.forEach((segment) => {
      const visibleColors = segment.colors.filter((_, i) =>
        chart.isDatasetVisible(segment.seriesIndices[i])
      )
      if (visibleColors.length < 2) return

      const startX = xScale.getPixelForValue(segment.startIndex)
      const endX = xScale.getPixelForValue(segment.endIndex)
      const baseY = yScale.getPixelForValue(segment.score)
      const spacing = visibleColors.length > 3 ? 1.65 : 2
      const center = (visibleColors.length - 1) / 2
      const maxOffset = center * spacing
      let shiftY = 0

      if (baseY - maxOffset < chartArea.top + 2) {
        shiftY = chartArea.top + 2 - (baseY - maxOffset)
      } else if (baseY + maxOffset > chartArea.bottom - 2) {
        shiftY = chartArea.bottom - 2 - (baseY + maxOffset)
      }

      if (endX <= startX || baseY < chartArea.top || baseY > chartArea.bottom) return

      ctx.beginPath()
      ctx.moveTo(startX, baseY + shiftY)
      ctx.lineTo(endX, baseY + shiftY)
      ctx.lineCap = 'butt'
      ctx.lineWidth = Math.min(6, 3 + visibleColors.length)
      ctx.strokeStyle = 'rgba(15,23,42,0.9)'
      ctx.stroke()

      visibleColors.forEach((color, index) => {
        const y = baseY + shiftY + (index - center) * spacing

        ctx.beginPath()
        ctx.moveTo(startX, y)
        ctx.lineTo(endX, y)
        ctx.lineCap = 'butt'
        ctx.lineWidth = 1.45
        ctx.strokeStyle = color
        ctx.stroke()
      })
    })
    ctx.restore()
  },
}

Tooltip.positioners.offCenter = function(elements, eventPosition) {
  if (!elements.length) return false

  const context = (elements[0].element as unknown as Record<string, unknown>).$context as
    { chart?: ChartJS } | undefined
  const chart = context?.chart
  if (!chart?.chartArea) return { x: eventPosition.x ?? 0, y: eventPosition.y ?? 0 }

  const { top } = chart.chartArea

  return {
    x: (eventPosition.x ?? 0) - 24,
    y: top + 24,
  }
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  scoreboardRevealPlugin,
  scoreboardOverlapSegmentPlugin,
  scoreboardSolvePointPlugin
)

function buildChartData(series: ChartSeries[], startDate?: string) {
  const allDates = new Set<string>()
  const seriesMeta = series.map(s => {
    const sortedData = [...s.data].sort((a, b) => a.date.localeCompare(b.date))
    sortedData.forEach(p => allDates.add(p.date))

    return {
      name: s.name,
      data: sortedData,
    }
  })

  const firstSolveDate = Array.from(allDates).sort()[0]
  const baselineDate = getBaselineDate(startDate, firstSolveDate)
  if (baselineDate) allDates.add(baselineDate)

  const lastSolveDate = Array.from(allDates).sort().at(-1)
  const endPaddingDate = lastSolveDate ? addMinutesToDateString(lastSolveDate, 1) : undefined
  if (endPaddingDate) allDates.add(endPaddingDate)

  const sortedDates = Array.from(allDates).sort()

  return sortedDates.map((date) => {
    const point: BuiltChartPoint = { date }
    seriesMeta.forEach(s => {
      if (baselineDate && date === baselineDate) {
        point[s.name] = 0
        return
      }

      const pts = s.data.filter(p => p.date <= date)
      if (pts.length > 0) point[s.name] = pts[pts.length - 1].score
    })
    return point
  })
}

function addMinutesToDateString(dateString: string, minutes: number) {
  const parsedDate = new Date(dateString)
  if (Number.isNaN(parsedDate.getTime())) return undefined

  return toLocalMinuteString(new Date(parsedDate.getTime() + minutes * 60000))
}

function getBaselineDate(startDate?: string, firstSolveDate?: string) {
  if (!firstSolveDate) return startDate
  if (startDate && startDate < firstSolveDate) return startDate

  const dayStart = `${firstSolveDate.slice(0, 10)}T00:00`
  return dayStart < firstSolveDate ? dayStart : undefined
}

function getFirstSolveDate(series: ChartSeries) {
  return [...series.data].sort((a, b) => a.date.localeCompare(b.date))[0]?.date
}

function toLocalMinuteString(date: Date) {
  return date.toISOString().slice(0, 16)
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  const mon = (d.getMonth() + 1).toString().padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${hh}:${mm} ${dd}/${mon}/${yyyy}`
}

function formatShortDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const dd = d.getDate().toString().padStart(2, '0')
  const mon = (d.getMonth() + 1).toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${dd}/${mon} ${hh}:${mm}`
}

function buildSolveMarkers(series: ChartSeries[], labels: string[]) {
  const labelIndexByDate = new Map(labels.map((date, index) => [date, index]))

  return series.flatMap((s, seriesIndex) => {
    const markersByDate = new Map<string, ScoreboardSolveMarker>()

    s.data.forEach((point) => {
      if (point.score <= 0) return

      const dataIndex = labelIndexByDate.get(point.date)
      if (dataIndex === undefined) return

      markersByDate.set(point.date, {
        color: SERIES_COLORS[seriesIndex % SERIES_COLORS.length],
        dataIndex,
        datasetIndex: seriesIndex,
        score: point.score,
      })
    })

    return Array.from(markersByDate.values())
  })
}

function buildOverlapSegments(series: ChartSeries[], builtData: BuiltChartPoint[]) {
  return builtData.slice(0, -1).flatMap((point, index) => {
    const scoreGroups = new Map<number, { color: string; seriesIndex: number }[]>()

    series.forEach((s, seriesIndex) => {
      const value = point[s.name]
      if (typeof value !== 'number' || value <= 0) return

      const group = scoreGroups.get(value) ?? []
      group.push({
        color: SERIES_COLORS[seriesIndex % SERIES_COLORS.length],
        seriesIndex,
      })
      scoreGroups.set(value, group)
    })

    return Array.from(scoreGroups.entries())
      .filter(([, group]) => group.length > 1)
      .map(([score, group]) => {
        const sorted = [...group].sort((a, b) => a.seriesIndex - b.seriesIndex)
        return {
          colors: sorted.map((entry) => entry.color),
          seriesIndices: sorted.map((entry) => entry.seriesIndex),
          endIndex: index + 1,
          score,
          startIndex: index,
        }
      })
  })
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

export default function BaseScoreboardChart({
  title,
  series,
  yAxisTitle = 'Score',
  startDate,
}: BaseScoreboardChartProps) {
  const chartRef = React.useRef<ChartJS<'line', (number | null)[], string> | null>(null)

  const builtData = React.useMemo(() => buildChartData(series, startDate), [series, startDate])
  const labels = React.useMemo(() => builtData.map(point => point.date), [builtData])
  const solveMarkers = React.useMemo(
    () => buildSolveMarkers(series, labels),
    [labels, series]
  )
  const overlapSegments = React.useMemo(
    () => buildOverlapSegments(series, builtData),
    [builtData, series]
  )
  const solveDateSets = React.useMemo(
    () => series.map(s => new Set(s.data.map(point => point.date))),
    [series]
  )
  const maxScore = React.useMemo(() => {
    let max = 0
    series.forEach((s) => {
      s.data.forEach((p) => {
        if (p.score > max) {
          max = p.score
        }
      })
    })
    return max
  }, [series])
  const drawOrderByName = React.useMemo(() => {
    const orderedSeries = series
      .map((s, index) => ({
        name: s.name,
        index,
        firstSolveDate: getFirstSolveDate(s),
      }))
      .sort((a, b) => {
        if (!a.firstSolveDate && !b.firstSolveDate) return a.index - b.index
        if (!a.firstSolveDate) return 1
        if (!b.firstSolveDate) return -1
        return a.firstSolveDate.localeCompare(b.firstSolveDate) || a.index - b.index
      })

    return new Map(orderedSeries.map((s, index) => [s.name, index]))
  }, [series])
  const chartKey = React.useMemo(
    () => `${startDate ?? ''}|${series.map(s => `${s.name}:${s.data.map(p => `${p.date}:${p.score}`).join(',')}`).join('|')}`,
    [series, startDate]
  )

  const chartData = React.useMemo<ChartData<'line', (number | null)[], string>>(() => ({
    labels,
    datasets: series.map((s, i) => {
      const color = SERIES_COLORS[i % SERIES_COLORS.length]

      return {
        label: s.name,
        data: builtData.map(point => {
          const value = point[s.name]
          return typeof value === 'number' ? value : null
        }),
        borderColor: color,
        backgroundColor: color,
        borderWidth: i === 0 ? 2.6 : 2,
        borderCapStyle: 'round' as const,
        borderJoinStyle: 'round' as const,
        order: drawOrderByName.get(s.name) ?? i,
        stepped: 'before' as const,
        tension: 0,
        pointRadius: 0,
        pointHitRadius: 12,
        pointHoverRadius: 0,
        pointBackgroundColor: color,
        pointBorderColor: '#f8fafc',
        pointBorderWidth: 1.35,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: color,
        pointHoverBorderWidth: 0,
        spanGaps: true,
      }
    }),
  }), [builtData, drawOrderByName, labels, series, solveDateSets])

  React.useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    chart.$scoreboardOverlapSegments = overlapSegments
    chart.$scoreboardSolveMarkers = solveMarkers

    return () => {
      chart.$scoreboardOverlapSegments = undefined
      chart.$scoreboardSolveMarkers = undefined
    }
  }, [overlapSegments, solveMarkers])

  const options = React.useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    transitions: {
      active: {
        animation: {
          duration: 160,
        },
      },
      resize: {
        animation: {
          duration: 250,
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          color: 'rgba(148,163,184,0.15)',
          tickColor: 'transparent',
        },
        border: {
          color: 'rgba(148,163,184,0.45)',
        },
        ticks: {
          color: 'rgb(148,163,184)',
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 50,
          callback(value) {
            return formatShortDateLabel(labels[Number(value)] ?? '')
          },
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: maxScore > 0 ? maxScore + Math.max(10, Math.round(maxScore * 0.05)) : 100,
        title: {
          display: true,
          text: yAxisTitle,
          color: 'rgb(148,163,184)',
          font: { size: 10, weight: 600 },
        },
        grid: {
          color: 'rgba(148,163,184,0.15)',
          tickColor: 'transparent',
        },
        border: {
          color: 'rgba(148,163,184,0.45)',
        },
        ticks: {
          color: 'rgb(148,163,184)',
          font: { size: 10 },
          padding: 8,
          precision: 0,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        align: 'center',
        labels: {
          boxWidth: 12,
          boxHeight: 8,
          color: 'rgb(148,163,184)',
          font: { size: 10 },
          padding: 14,
          sort(a, b) {
            return (a.datasetIndex ?? 0) - (b.datasetIndex ?? 0)
          },
        },
      },
      tooltip: {
        enabled: true,
        position: 'offCenter',
        yAlign: 'center',
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(2,6,23,0.96)',
        borderColor: 'rgba(148,163,184,0.25)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        boxPadding: 6,
        bodySpacing: 5,
        caretPadding: 24,
        caretSize: 12,
        cornerRadius: 8,
        filter(item) {
          const v = item.parsed.y
          return typeof v === 'number' && v > 0
        },
        itemSort(a, b) {
          const scoreA = a.parsed.y ?? 0
          const scoreB = b.parsed.y ?? 0
          return scoreB - scoreA || a.datasetIndex - b.datasetIndex
        },
        callbacks: {
          title(items) {
            return formatDateLabel(labels[items[0]?.dataIndex ?? 0] ?? '')
          },
          label(context: TooltipItem<'line'>) {
            const v = context.parsed.y
            if (!v || v <= 0) return ''
            return `${context.dataset.label}: ${v}`
          },
        },
      },
    },
  }), [labels, yAxisTitle, maxScore])

  React.useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    let frameId = 0
    const start = performance.now()
    const duration = 750

    const tick = (now: number) => {
      if (chartRef.current !== chart || !chart.ctx || !chart.canvas) return

      const rawProgress = Math.min((now - start) / duration, 1)
      chart.$scoreboardRevealProgress = easeOutCubic(rawProgress)
      chart.draw()

      if (rawProgress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    chart.$scoreboardRevealProgress = 0
    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
      chart.$scoreboardRevealProgress = 1
    }
  }, [chartKey])

  return (
    <BaseScoreboardCard
      title={title}
      headerClassName="justify-center border-b-0 pb-1"
      titleClassName="text-center"
      contentClassName="px-3 pt-0 sm:px-5"
    >
      <div className="h-[300px] w-full">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </BaseScoreboardCard>
  )
}
