import { supabase } from '@/lib/supabase/client'

export type SiteInfo = {
  total_users: number
  total_admins: number
  total_solves: number
  unique_solvers: number
  total_challenges: number
  active_challenges: number
}

type SiteInfoRpc = Partial<SiteInfo>

export class SiteInfoService {
  static async getInfo(): Promise<SiteInfo | null> {
    try {
      const { data, error } = await supabase.rpc('get_info')
      if (error || !data) return null
      const parsed = data as SiteInfoRpc
      return {
        total_users: Number(parsed.total_users || 0),
        total_admins: Number(parsed.total_admins || 0),
        total_solves: Number(parsed.total_solves || 0),
        unique_solvers: Number(parsed.unique_solvers || 0),
        total_challenges: Number(parsed.total_challenges || 0),
        active_challenges: Number(parsed.active_challenges || 0),
      }
    } catch {
      return null
    }
  }
}

