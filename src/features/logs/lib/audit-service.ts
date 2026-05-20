import { supabase } from '@/lib/supabase/client'

export interface AuditLogEntry {
  id: string
  created_at: string
  ip_address: string | null
  payload: {
    action: string
    actor_username?: string
    traits?: {
      provider?: string
      user_id?: string
      user_email?: string
    }
  }
}

/**
 * Fetch audit logs via RPC (auto pagination, adaptive limit)
 */
export async function getAuditLogs(limit = 1000): Promise<AuditLogEntry[]> {
  const batchSize = 1000

  if (limit <= batchSize) {
    const { data, error } = await supabase.rpc('get_auth_audit_logs', {
      p_limit: limit,
      p_offset: 0,
    })

    if (error) {
      console.error('Error fetching audit logs RPC:', error)
      return []
    }

    return (data ?? []) as unknown as AuditLogEntry[]
  }

  const batchCount = Math.ceil(limit / batchSize)
  const promises = Array.from({ length: batchCount }, (_, i) =>
    supabase.rpc('get_auth_audit_logs', {
      p_limit: batchSize,
      p_offset: i * batchSize,
    })
  )

  const results = await Promise.all(promises)
  const logs = results.flatMap(({ data }) => (data ?? []) as unknown as AuditLogEntry[])

  return logs.slice(0, limit)
}
