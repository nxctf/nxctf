import { supabase } from '@/lib/supabase/client'
import type { AdminUserRow, UserSocialLinks } from '../types'

function normalizeSocialLinks(value: unknown): UserSocialLinks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function normalizeAdminUser(row: any): AdminUserRow {
  return {
    id: String(row.id),
    username: String(row.username ?? ''),
    email: row.email ? String(row.email) : null,
    is_admin: !!row.is_admin,
    bio: row.bio ? String(row.bio) : null,
    sosmed: normalizeSocialLinks(row.sosmed),
    profile_picture_url: row.profile_picture_url ? String(row.profile_picture_url) : null,
    banned_until: row.banned_until ? String(row.banned_until) : null,
    ban_reason: row.ban_reason ? String(row.ban_reason) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }
}

export async function getAdminUsers(params?: {
  search?: string
  role?: 'all' | 'admin' | 'user'
  sortBy?: 'newest' | 'oldest' | 'username_asc' | 'updated_desc' | 'role'
  limit?: number
  offset?: number
  status?: 'all' | 'banned' | 'active'
}): Promise<{ users: AdminUserRow[]; totalCount: number }> {
  try {
    const { data, error } = await supabase.rpc('get_admin_users_paginated', {
      p_search: params?.search || null,
      p_role: params?.role || 'all',
      p_sort_by: params?.sortBy || 'newest',
      p_limit: params?.limit || 100,
      p_offset: params?.offset || 0,
      p_status: params?.status || 'all',
    })

    if (error) {
      console.error('Error fetching admin users RPC:', error)
      return { users: [], totalCount: 0 }
    }

    const totalCount = data && data[0] ? Number(data[0].total_count) : 0

    return {
      users: (data || []).map(normalizeAdminUser),
      totalCount,
    }
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return { users: [], totalCount: 0 }
  }
}

export async function adminChangePassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('admin_change_password', {
      p_user_id: userId,
      p_new_password: password
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

export async function adminBanUser(
  userId: string,
  durationMinutes: number | null,
  reason: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('admin_ban_user', {
      p_user_id: userId,
      p_duration_minutes: durationMinutes,
      p_reason: reason || 'Banned by administrator'
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

export async function adminUnbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('admin_unban_user', {
      p_user_id: userId
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}
