import { supabase } from '@/lib/supabase/client'

export type AdminScope = {
  is_global_admin: boolean
  event_ids: string[]
}

export type UserLite = {
  id: string
  username: string
  is_admin?: boolean
}

export type EventAdminRow = {
  user_id: string
  username: string
  event_id: string
  event_name: string
  created_at: string
}

type AdminScopeRpc = {
  is_global_admin?: boolean
  event_ids?: unknown[]
}

type GrantEventAdminRpc = {
  success?: boolean
  message?: string
}

type RevokeEventAdminRpc = {
  success?: boolean
  deleted?: number
  message?: string
}

export class AdminService {
  static async isGlobalAdmin(): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) return false
    return !!data
  }

  static async getAdminScope(): Promise<AdminScope> {
    const { data, error } = await supabase.rpc('get_admin_scope')
    if (error || !data) return { is_global_admin: false, event_ids: [] }
    const parsed = data as AdminScopeRpc
    return {
      is_global_admin: !!parsed.is_global_admin,
      event_ids: Array.isArray(parsed.event_ids) ? parsed.event_ids.map((value) => String(value)) : [],
    }
  }

  static async hasAdminAccess(): Promise<boolean> {
    const scope = await AdminService.getAdminScope()
    return scope.is_global_admin || scope.event_ids.length > 0
  }

  static async isAdmin(): Promise<boolean> {
    return AdminService.hasAdminAccess()
  }

  static async getGlobalAdmins(): Promise<UserLite[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id,username,is_admin')
      .eq('is_admin', true)
      .order('username', { ascending: true })

    if (error) return []
    return (data || []).map((user) => ({
      id: String(user.id),
      username: String(user.username),
      is_admin: !!user.is_admin,
    }))
  }

  static async searchUsersByUsername(query: string, limit = 8): Promise<UserLite[]> {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) return []

    const { data, error } = await supabase
      .from('users')
      .select('id,username,is_admin')
      .ilike('username', `%${normalizedQuery}%`)
      .order('username', { ascending: true })
      .limit(limit)

    if (error) return []
    return (data || []).map((user) => ({
      id: String(user.id),
      username: String(user.username),
      is_admin: !!user.is_admin,
    }))
  }

  static async getEventAdmins(): Promise<EventAdminRow[]> {
    const { data, error } = await supabase.rpc('get_event_admins')
    if (error) return []
    return (Array.isArray(data) ? data : []).map((row) => {
      const parsed = row as Record<string, unknown>
      return {
        user_id: String(parsed.user_id),
        username: String(parsed.username),
        event_id: String(parsed.event_id),
        event_name: String(parsed.event_name),
        created_at: String(parsed.created_at),
      }
    })
  }

  static async grantEventAdmin(userId: string, eventId: string): Promise<{ success: boolean; message?: string }> {
    const { data, error } = await supabase.rpc('grant_event_admin', {
      p_user_id: userId,
      p_event_id: eventId,
    })
    if (error) throw error
    const parsed = (data || {}) as GrantEventAdminRpc
    return { success: !!parsed.success, message: parsed.message ? String(parsed.message) : undefined }
  }

  static async revokeEventAdmin(userId: string, eventId: string): Promise<{ success: boolean; deleted?: number; message?: string }> {
    const { data, error } = await supabase.rpc('revoke_event_admin', {
      p_user_id: userId,
      p_event_id: eventId,
    })
    if (error) throw error
    const parsed = (data || {}) as RevokeEventAdminRpc
    return {
      success: !!parsed.success,
      deleted: typeof parsed.deleted === 'number' ? parsed.deleted : undefined,
      message: parsed.message ? String(parsed.message) : undefined,
    }
  }
}

