"use client"

import { useState, useCallback } from 'react'
import { Challenge, SiteInfo, Event, SolverRow, AdminScope } from '../types'
import { getScheduledJobs } from '@/shared/lib'
import {
  getAdminScope,
  getChallengesList,
  getEvents,
  getInfo,
  getSolversAll,
  setChallengeActive,
  setChallengeMaintenance,
  deleteChallenge
} from '../lib'
import toast from 'react-hot-toast'

export function useAdminChallengesData() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [solvers, setSolvers] = useState<SolverRow[]>([])
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [adminScope, setAdminScope] = useState<AdminScope | null>(null)
  const [scheduledJobsMap, setScheduledJobsMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshChallenges = useCallback(async () => {
    const data = await getChallengesList(undefined, true, 'all')
    setChallenges(data)
  }, [])

  const refreshSolvers = useCallback(async (offset = 0) => {
    const data = await getSolversAll(50, offset)
    setSolvers(prev => offset === 0 ? data : [...prev, ...data])
  }, [])

  const initAdminData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const scope = await getAdminScope()
      setAdminScope(scope)

      const [challengeList, info, eventList, scheduledJobs] = await Promise.all([
        getChallengesList(undefined, true, 'all'),
        getInfo(),
        getEvents(),
        getScheduledJobs('pending'),
      ])

      setChallenges(challengeList)
      setSiteInfo(info)

      return challengeList
      setScheduledJobsMap(
        Object.fromEntries(
          (scheduledJobs || [])
            .filter((j: any) => j.job_type === 'challenge_activate' && j.target_id)
            .map((j: any) => [String(j.target_id), j.scheduled_at])
        )
      )

      const allowedSet = new Set(scope.event_ids || [])
      const visibleEvents = scope.is_global_admin
        ? eventList
        : eventList.filter((e) => allowedSet.has(String(e.id)))
      setEvents(visibleEvents)

      await refreshSolvers(0)
    } catch (err) {
      console.error('Failed to init admin data:', err)
      toast.error('Failed to load admin dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [refreshSolvers])

  const toggleChallengeActive = async (id: string, active: boolean) => {
    const ok = await setChallengeActive(id, active)
    if (ok) {
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, is_active: active } : c))
      toast.success(`Challenge ${active ? 'activated' : 'deactivated'}`)
    }
    return ok
  }

  const toggleChallengeMaintenance = async (id: string, maintenance: boolean) => {
    const ok = await setChallengeMaintenance(id, maintenance)
    if (ok) {
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, is_maintenance: maintenance } : c))
      toast.success(`Challenge maintenance ${maintenance ? 'enabled' : 'disabled'}`)
    }
    return ok
  }

  const removeChallenge = async (id: string) => {
    try {
      await deleteChallenge(id)
      await refreshChallenges()
      toast.success('Challenge deleted successfully')
      return true
    } catch (err) {
      toast.error('Failed to delete challenge')
      return false
    }
  }

  return {
    challenges,
    solvers,
    siteInfo,
    events,
    adminScope,
    scheduledJobsMap,
    isLoading,
    isRefreshing,
    initAdminData,
    refreshChallenges,
    refreshSolvers,
    toggleChallengeActive,
    toggleChallengeMaintenance,
    removeChallenge
  }
}
