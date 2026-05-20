import { ChallengeWithSolve } from '@/shared/types'
import type React from 'react'

export type UserDetail = {
  id: string
  username: string
  rank: number | null
  score: number
  picture?: string | null
  profile_picture_url?: string | null
  bio?: string | null
  sosmed?: {
    linkedin?: string
    instagram?: string
    discord?: string
    web?: string
    [key: string]: string | undefined
  } | null
  created_at?: string | null
  last_login_at?: string | null
  solved_challenges: ChallengeWithSolve[]
}

export type UserProfileProps = {
  userId: string | null
  loading: boolean
  error?: string | null
  onBack?: () => void
  isCurrentUser?: boolean
}

export type Badge = {
  label: string
  color: string
  icon: React.ReactElement
}

export type TeamInfo = {
  team: any
  members: any[]
}
