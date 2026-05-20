import { supabase } from '@/lib/supabase/client'

export interface DailyStats {
  date: string;
  solves: number;
  activeUsers: number;
}

async function getStatsByRangeImpl(range: '7d' | '30d' | '90d'): Promise<DailyStats[]> {
  const now = new Date()
  now.setHours(23, 59, 59, 999) // Set to end of current day

  const start = new Date()
  start.setHours(0, 0, 0, 0) // Set to start of day

  // Set start date based on range and include current day in count
  if (range === '7d') start.setDate(start.getDate() - 6) // 7 days including today
  else if (range === '30d') start.setDate(start.getDate() - 29) // 30 days including today
  else start.setDate(start.getDate() - 89) // 90 days including today

  const { data, error } = await supabase.rpc('get_activity_stats', {
    p_start: start.toISOString(),
    p_end: now.toISOString(),
  })

  if (error) {
    console.error('Error fetching activity stats:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    date: String(row.date),
    solves: Number(row.solves || 0),
    activeUsers: Number(row.active_users || 0),
  }))
}

export class ActivityStatsService {
  static getStatsByRange = getStatsByRangeImpl
}


