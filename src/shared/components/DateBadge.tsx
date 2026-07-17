import React from 'react'
import { CalendarDays } from 'lucide-react'

interface DateBadgeProps {
  dateStr: string | undefined | null
  className?: string
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year} ${hours}:${minutes}`
}

export default function DateBadge({ dateStr, className = '' }: DateBadgeProps) {
  const formatted = formatDate(dateStr)
  if (!formatted) return null

  return (
    <span className={`inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 ${className}`}>
      <CalendarDays size={11} />
      {formatted}
    </span>
  )
}
