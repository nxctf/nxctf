export interface User {
  id: string
  username: string
  picture?: string
  profile_picture_url?: string | null
  score: number
  rank?: number
  is_admin?: boolean
  banned_until?: string | null
  ban_reason?: string | null
  created_at: string
  updated_at: string
}

export interface Attachment {
  name: string
  url: string
  type: 'file' | 'link'
}

export interface Event {
  id: string
  name: string
  description?: string | null
  join_mode?: 'open' | 'request' | 'key'
  join_key?: string | null
  start_time?: string | null
  end_time?: string | null
  always_show_challenges?: boolean | null
  image_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface EventJoinSettings {
  success: boolean
  event_id: string
  join_mode: 'open' | 'request' | 'key'
  has_join_key: boolean
  message?: string
}

export interface EventMembershipStatus {
  success: boolean
  event_id: string
  join_mode: 'open' | 'request' | 'key'
  is_member: boolean
  request_status: 'pending' | 'approved' | 'rejected' | null
  message?: string
}

export interface EventJoinRequestRow {
  request_id: string
  event_id: string
  user_id: string
  username: string
  status: 'pending' | 'approved' | 'rejected'
  note?: string | null
  requested_at: string
  reviewed_at?: string | null
  reviewed_by?: string | null
}

export interface EventMemberRow {
  event_id: string
  user_id: string
  username: string
  joined_at: string
  joined_by?: string | null
}

export interface Challenge {
  id: string
  event_id?: string | null
  title: string
  description: string
  category: string
  points: number
  max_points?: number
  flag: string
  hint?: string
  attachments?: Attachment[]
  difficulty: string
  is_active: boolean
  is_maintenance: boolean
  is_dynamic: boolean
  min_points: number
  decay_per_solve: number
  flag_placeholder?: boolean
  services?: string[]
  created_at: string
  updated_at: string
}

export interface Solve {
  id: string
  user_id: string
  challenge_id: string
  created_at: string
}

export interface ChallengeWithSolve extends Challenge {
  is_solved?: boolean
  solved_at?: string // Add this line to support solved_at in UserProfile
  total_solves?: number
}

// export interface LeaderboardEntry {
//   id: string
//   username: string
//   score: number
//   rank: number
// }

export type LeaderboardEntry = {
  id: string
  username: string
  score: number
  rank: number
  picture?: string | null
  progress: {
    date: string
    score: number
  }[]
}
