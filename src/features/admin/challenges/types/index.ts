import type { Attachment } from '@/shared/types'

export type { Attachment, Challenge, Event } from '@/shared/types'

export type SolverRow = {
  solve_id: string
  username: string
  challenge_title: string
  solved_at: string
}

export type SiteInfo = {
  total_users: number
  total_admins?: number
  total_solves: number
  unique_solvers?: number
}

export type ChallengeFormData = {
  title: string
  description: string
  category: string
  points: number | ''
  max_points: number | ''
  flag: string
  hint: string[]
  difficulty: string
  attachments: Attachment[]
  is_dynamic: boolean
  is_active: boolean
  is_maintenance: boolean
  min_points: number | ''
  decay_per_solve: number | ''
  event_id: string | null
  flag_placeholder: boolean
  services: string[]
}

export type SubChallengeFormRow = {
  id?: string
  question: string
  answer: string
  order_number: number | ''
  is_sequential: boolean
}

export type AdminScope = {
  is_global_admin: boolean
  event_ids: string[]
}

export type AdminChallengeEventId = string | null | 'all'

export type AdminChallengeFilterState = {
  category: string
  difficulty: string
  search: string
  feature: 'T' | 'S' | 'N'
}

export type ChallengePayload = {
  title: string
  description: string
  category: string
  points: number
  hint: string[] | null
  difficulty: string
  attachments: Attachment[]
  is_maintenance: boolean
  event_id: string | null
  flag: string
  is_active?: boolean
  is_dynamic?: boolean
  min_points?: number
  decay_per_solve?: number
  max_points?: number
  flag_placeholder?: boolean
  services?: string[]
}
