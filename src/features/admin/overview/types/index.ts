import type { DailyStats } from '../services/activity-stats.service'
import type { SiteInfo as SharedSiteInfo } from '@/features/admin/overview/services/site-info.service'

export type TimeRange = '7d' | '30d' | '90d'

export type ActivityPoint = DailyStats
export type SiteInfo = SharedSiteInfo

export type ActionType = 'login' | 'logout' | 'user_signedup' | 'user_deleted' | 'token_refreshed'
