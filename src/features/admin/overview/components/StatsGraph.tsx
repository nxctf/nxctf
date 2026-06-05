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
  TimeScale
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import type { ChartData, ChartOptions, Scale, Tick, CoreScaleOptions } from 'chart.js'
import type { ActivityPoint, TimeRange } from '../types'
import React from 'react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

interface StatsGraphProps {
  data: ActivityPoint[]
  range: TimeRange
}

const StatsGraph = ({ data, range }: StatsGraphProps) => {
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: range === '7d' ? 'day' : range === '30d' ? 'week' : 'month',
          tooltipFormat: 'PPP',
          displayFormats: {
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy'
          }
        },
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        min: 0,
        grace: '10%',
        border: {
          display: false
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          stepSize: 2,
          padding: 10,
          callback: function (this: Scale<CoreScaleOptions>, tickValue: string | number, _index: number, _ticks: Tick[]) {
            return typeof tickValue === 'number' ? tickValue.toFixed(0) : String(tickValue)
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          color: 'rgb(156, 163, 175)',
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgb(17, 24, 39)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(243, 244, 246)',
        padding: 12,
        boxPadding: 8,
        bodySpacing: 8,
        titleSpacing: 8,
        cornerRadius: 6,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        displayColors: false
      }
    }
  }

  const chartData: ChartData<'line', { x: Date; y: number }[], unknown> = {
    datasets: [
      {
        label: 'Solves',
        data: data.map(d => ({ x: new Date(d.date), y: d.solves })),
        borderColor: 'rgb(99, 102, 241)', // Indigo
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: 'rgb(99, 102, 241)',
        pointHoverBorderColor: 'rgb(255, 255, 255)',
        pointHoverBorderWidth: 2,
        fill: true
      },
      {
        label: 'Active Users',
        data: data.map(d => ({ x: new Date(d.date), y: d.activeUsers })),
        borderColor: 'rgb(34, 197, 94)', // Green
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: 'rgb(34, 197, 94)',
        pointHoverBorderColor: 'rgb(255, 255, 255)',
        pointHoverBorderWidth: 2,
        fill: true
      }
    ]
  }

  return (
    <div className="h-[310px] w-full">
      <Line options={options} data={chartData} />
    </div>
  )
}

export default StatsGraph
