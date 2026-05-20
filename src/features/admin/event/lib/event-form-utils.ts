import type { EventFormData, FilterState } from '../types'

export const EMPTY_EVENT_FORM: EventFormData = {
  name: '',
  description: '',
  join_mode: 'open',
  join_key: '',
  start_time: '',
  end_time: '',
  always_show_challenges: false,
  image_url: '',
}

export const DEFAULT_EVENT_FILTERS: FilterState = {
  category: 'all',
  difficulty: 'all',
  search: '',
  feature: 'N',
}

export const toEventInputValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export const fromEventInputValue = (value: string) => {
  if (!value) return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date.toISOString()
}

export const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}

