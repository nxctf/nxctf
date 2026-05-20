import { supabase } from '@/lib/supabase/client'
import type { ChallengeWithSolve, User } from '@/shared/types'

export type UserDetail = {
  id: string
  username: string
  rank: number | null
  score: number
  picture?: string | null
  profile_picture_url?: string | null
  bio?: string
  sosmed?: Record<string, string>
  created_at?: string | null
  last_login_at?: string | null
  solved_challenges: ChallengeWithSolve[]
}

export type UserProfileLite = {
  id: string
  username: string
  picture?: string | null
  profile_picture_url?: string | null
  solved_event_ids: string[]
  has_main_solved: boolean
}

type DetailUserRpcChallenge = {
  challenge_id: string
  title: string
  category: string
  points: number
  difficulty: string
  solved_at?: string | null
}

type DetailUserRpc = {
  success?: boolean
  message?: string
  user?: {
    id: string
    username: string
    rank?: number | null
    score?: number | null
    picture?: string | null
    profile_picture_url?: string | null
    bio?: string | null
    sosmed?: Record<string, string> | null
    created_at?: string | null
    last_login_at?: string | null
  }
  solved_challenges?: DetailUserRpcChallenge[]
}

type ProfileLiteRpc = {
  id: string
  username: string
  picture?: string | null
  profile_picture_url?: string | null
  solved_event_ids?: unknown[]
  has_main_solved?: boolean
}

type UpdateRpc<T extends Record<string, unknown>> = T & {
  success?: boolean
  message?: string
}

const normalizeTimestamp = (value?: string | null): string | null => {
  if (!value) return null
  let normalized = value.trim()
  if (normalized.includes(' ') && !normalized.includes('T')) {
    normalized = normalized.replace(' ', 'T')
  }
  if (/([+-]\d{2})$/.test(normalized)) {
    normalized = normalized.replace(/([+-]\d{2})$/, '$1:00')
  } else if (/([+-]\d{2})(\d{2})$/.test(normalized)) {
    normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  }
  return normalized
}

export class UserProfileService {
  static async getUserDetail(userId: string, eventId?: string | null, eventMode?: string): Promise<UserDetail | null> {
    try {
      const { data: rawData, error } = await supabase.rpc('detail_user', {
        p_id: userId,
        p_event_id: eventId ?? undefined,
        p_event_mode: eventMode ?? (eventId ? 'equals' : 'any')
      })
      const data = rawData as unknown as DetailUserRpc | null
      if (error || !data?.success || !data.user) return null
      return {
        id: data.user.id,
        username: data.user.username,
        rank: data.user.rank ?? null,
        score: data.user.score ?? 0,
        picture: data.user.picture ?? null,
        profile_picture_url: data.user.profile_picture_url ?? null,
        bio: data.user.bio ?? '',
        sosmed: data.user.sosmed ?? {},
        created_at: normalizeTimestamp(data.user.created_at),
        last_login_at: normalizeTimestamp(data.user.last_login_at),
        solved_challenges: (data.solved_challenges || []).map((challenge) => ({
          id: challenge.challenge_id,
          title: challenge.title,
          category: challenge.category,
          points: challenge.points,
          difficulty: challenge.difficulty,
          is_solved: true,
          solved_at: challenge.solved_at ?? undefined,
          // Required Challenge fields not returned by RPC — defaulted
          description: '',
          flag: '',
          flag_hash: '',
          is_active: true,
          is_maintenance: false,
          is_dynamic: false,
          min_points: 0,
          decay_per_solve: 0,
          created_at: '',
          updated_at: '',
        })),
      }
    } catch {
      return null
    }
  }

  static async getUserProfileLite(userId: string): Promise<UserProfileLite | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_profile', { p_id: userId })
      if (error) return null
      const row = (Array.isArray(data) ? data[0] : data) as ProfileLiteRpc | null
      if (!row) return null
      return {
        id: row.id,
        username: row.username,
        picture: row.picture ?? null,
        profile_picture_url: row.profile_picture_url ?? null,
        solved_event_ids: Array.isArray(row.solved_event_ids) ? row.solved_event_ids.filter(Boolean).map((id) => String(id)) : [],
        has_main_solved: !!row.has_main_solved,
      }
    } catch {
      return null
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('username', username).single()
      if (error) return null
      return data as unknown as User
    } catch {
      return null
    }
  }

  static async updateUsername(userId: string, newUsername: string): Promise<{ error: string | null, username?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_username', { p_id: userId, p_username: newUsername })
      const parsed = data as UpdateRpc<{ username?: string }> | null
      if (error || !parsed?.success) return { error: error?.message || parsed?.message || 'Failed to update username' }
      return { error: null, username: parsed.username }
    } catch {
      return { error: 'Failed to update username' }
    }
  }

  static async updateBio(userId: string, newBio: string): Promise<{ error: string | null, bio?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_bio', { p_id: userId, p_bio: newBio })
      const parsed = data as UpdateRpc<{ bio?: string }> | null
      if (error || !parsed?.success) return { error: error?.message || parsed?.message || 'Failed to update bio' }
      return { error: null, bio: parsed.bio }
    } catch {
      return { error: 'Failed to update bio' }
    }
  }

  static async updateSosmed(userId: string, newSosmed: Record<string, string>): Promise<{ error: string | null, sosmed?: Record<string, string> }> {
    try {
      const { data, error } = await supabase.rpc('update_sosmed', { p_id: userId, p_sosmed: newSosmed })
      const parsed = data as UpdateRpc<{ sosmed?: Record<string, string> }> | null
      if (error || !parsed?.success) return { error: error?.message || parsed?.message || 'Failed to update sosmed' }
      return { error: null, sosmed: parsed.sosmed }
    } catch {
      return { error: 'Failed to update sosmed' }
    }
  }

  static async updateProfilePicture(userId: string, profilePictureUrl: string): Promise<{ error: string | null, profile_picture_url?: string | null }> {
    try {
      const { data, error } = await supabase.rpc('update_profile_picture', { p_id: userId, p_profile_picture_url: profilePictureUrl })
      const parsed = data as UpdateRpc<{ profile_picture_url?: string | null }> | null
      if (error || !parsed?.success) return { error: error?.message || parsed?.message || 'Failed to update profile picture' }
      return { error: null, profile_picture_url: parsed.profile_picture_url ?? null }
    } catch {
      return { error: 'Failed to update profile picture' }
    }
  }
}

