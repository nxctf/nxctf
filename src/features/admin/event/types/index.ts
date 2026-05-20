import type { Event, EventJoinRequestRow, EventMemberRow } from '@/shared/types'
import type { UserLite } from '@/features/admin/services/admin.service'

export type { Event, EventJoinRequestRow, EventMemberRow, UserLite }

export type ChallengeLite = {
  id: string
  title: string
  category?: string
  difficulty?: string
  event_id?: string | null
  is_active?: boolean | null
}

export type FilterState = {
  category: string
  difficulty: string
  search: string
  feature: 'T' | 'S' | 'N'
}

export type EventJoinMode = 'open' | 'request' | 'key'

export type EventFormData = {
  name: string
  description: string
  join_mode: EventJoinMode
  join_key: string
  start_time: string
  end_time: string
  always_show_challenges: boolean
  image_url: string
}
