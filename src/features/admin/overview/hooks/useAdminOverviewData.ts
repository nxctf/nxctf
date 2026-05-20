"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/contexts'
import { AuthService } from '@/features/auth'
import { SiteInfoService } from '@/features/admin/overview/services/site-info.service'
import { ChallengeService } from '@/shared/lib'
import type { Challenge } from '@/shared/types'
import type { ActivityPoint, TimeRange, SiteInfo } from '../types'
import { ActivityStatsService } from '../services/activity-stats.service'

export function useAdminOverviewData() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [activityData, setActivityData] = useState<ActivityPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshStats = useCallback(async (newRange: TimeRange) => {
    setTimeRange(newRange)
    const stats = await ActivityStatsService.getStatsByRange(newRange)
    setActivityData(stats)
  }, [])

  useEffect(() => {
    let mounted = true

    const initOverviewData = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/challenges')
        return
      }

      const adminCheck = await AuthService.isGlobalAdmin()
      if (!mounted) return
      if (!adminCheck) {
        router.push('/challenges')
        return
      }

      const [challengeList, info, stats] = await Promise.all([
        ChallengeService.getChallengesList(undefined, true),
        SiteInfoService.getInfo(),
        ActivityStatsService.getStatsByRange(timeRange),
      ])

      if (!mounted) return
      setChallenges(challengeList)
      setSiteInfo(info)
      setActivityData(stats)
      setIsLoading(false)
    }

    initOverviewData()
    return () => { mounted = false }
  }, [authLoading, user, router, timeRange])

  return {
    user,
    authLoading,
    isLoading,
    challenges,
    siteInfo,
    timeRange,
    activityData,
    refreshStats,
  }
}
