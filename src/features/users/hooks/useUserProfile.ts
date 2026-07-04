import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import APP from '@/config'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
import { AuthService } from '@/features/auth'
import { getTeamByUserId } from '@/features/teams/services/team.service'
import {
  getUserEventAccess,
  getUserDetail,
  getUserProfileLite,
} from '@/features/users/services/user-profile.service'
import {
  getCategoryTotals,
  getDifficultyTotals,
} from '@/features/users/services/user-stats.service'
import {
  getFirstBloodChallengeIds,
  getChallenges
} from '@/shared/lib'
import { useAuth } from '@/shared/contexts'
import { useEventContext } from '@/features/events/contexts/EventContext'
import type { ChallengeWithSolve, Event } from '@/shared/types'
import { UserDetail, TeamInfo, UserEventAccess } from '../types'

export function useUserProfile(userId: string | null, isCurrentUser: boolean) {
  const router = useRouter()
  const { setUser } = useAuth()
  const { startedEvents, selectedEvent, setSelectedEvent } = useEventContext()

  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [solvedEventIds, setSolvedEventIds] = useState<string[]>([])
  const [eventAccess, setEventAccess] = useState<UserEventAccess[]>([])
  const [hasMainSolved, setHasMainSolved] = useState(false)
  const [firstBloodIds, setFirstBloodIds] = useState<string[]>([])
  const [categoryTotals, setCategoryTotals] = useState<{ category: string; total_challenges: number }[]>([])
  const [difficultyTotals, setDifficultyTotals] = useState<{ difficulty: string; total_challenges: number }[]>([])
  const flagStats = userDetail?.flag_stats ?? null
  const [loadingDetail, setLoadingDetail] = useState<boolean>(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const isInitialDetailLoadRef = useRef(true)

  const [showAllModal, setShowAllModal] = useState(false)
  const [showUnsolvedModal, setShowUnsolvedModal] = useState(false)
  const [unsolvedChallenges, setUnsolvedChallenges] = useState<ChallengeWithSolve[]>([])
  const [loadingUnsolved, setLoadingUnsolved] = useState(false)

  const [authInfo, setAuthInfo] = useState<Array<{ provider: string; email: string }>>([])
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const activeTab: 'profile' | 'stats' = useMemo(() => {
    const value = searchParams.get('tab')
    return value === 'stats' ? 'stats' : 'profile'
  }, [searchParams])
  const setActiveTab = useCallback((tab: 'profile' | 'stats') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  useEffect(() => {
    if (isCurrentUser) {
      AuthService.getCurrentAuthInfo().then(setAuthInfo)
    }
  }, [isCurrentUser])

  useEffect(() => {
    if (!userId) return
    let mounted = true
    ;(async () => {
      try {
        const [profile, access] = await Promise.all([
          getUserProfileLite(userId),
          getUserEventAccess(userId),
        ])
        if (!mounted || !profile) return
        setSolvedEventIds(profile.solved_event_ids || [])
        setHasMainSolved(!!profile.has_main_solved)
        setEventAccess(access)
      } catch (err) {
        console.error('Error fetching profile events:', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [userId])

  const solvedChallenges = userDetail?.solved_challenges || []
  const solvedEventSet = useMemo(
    () => new Set((solvedEventIds || []).map((id) => String(id))),
    [solvedEventIds]
  )
  const profileEvents = useMemo(
    () => startedEvents.filter((ev) => solvedEventSet.has(String(ev.id))),
    [startedEvents, solvedEventSet]
  )

  const { settings } = useSystemSettings()
  const showMainOption = hasMainSolved && !settings.disable_default_challenges

  const effectiveSelectedEvent = useMemo(() => {
    const allowed = new Set<string>(['all'])
    if (showMainOption) allowed.add('main')
    for (const ev of profileEvents) allowed.add(String(ev.id))

    return allowed.has(String(selectedEvent))
      ? selectedEvent
      : 'all'
  }, [profileEvents, selectedEvent, showMainOption])

  const effectiveSelectedEventId = useMemo(
    () => (effectiveSelectedEvent === 'all' || effectiveSelectedEvent === 'main' ? null : effectiveSelectedEvent),
    [effectiveSelectedEvent]
  )
  const effectiveSelectedEventMode = useMemo(
    () => (effectiveSelectedEvent === 'all' ? 'any' : effectiveSelectedEvent === 'main' ? 'is_null' : 'equals'),
    [effectiveSelectedEvent]
  )

  useEffect(() => {
    const fetchDetail = async () => {
      if (!userId) return
      if (isInitialDetailLoadRef.current) setLoadingDetail(true)
      try {
        const detail = await getUserDetail(
          userId,
          effectiveSelectedEventId,
          effectiveSelectedEventMode
        )
        setUserDetail(detail)

        if (detail) {

          const firstBlood = await getFirstBloodChallengeIds(detail.id)
          const solvedIds = new Set((detail.solved_challenges || []).map(c => c.id))
          setFirstBloodIds(firstBlood.filter(id => solvedIds.has(id)))

          const totals = await getCategoryTotals(
            effectiveSelectedEventId,
            effectiveSelectedEventMode
          )
          setCategoryTotals(totals)

          const diffTotals = await getDifficultyTotals(
            effectiveSelectedEventId,
            effectiveSelectedEventMode
          )
          setDifficultyTotals(diffTotals)

          if (APP.teams.enabled) {
            const { team, members } = await getTeamByUserId(detail.id)
            if (team) setTeamInfo({ team, members })
            else setTeamInfo(null)
          }
        }
      } finally {
        setLoadingDetail(false)
        setInitialLoading(false)
        isInitialDetailLoadRef.current = false
      }
    }
    fetchDetail()
  }, [userId, effectiveSelectedEventId, effectiveSelectedEventMode])

  const refreshUserDetail = async () => {
    if (!userId) return
    try {
      const detail = await getUserDetail(
        userId,
        effectiveSelectedEventId,
        effectiveSelectedEventMode
      )
      setUserDetail(detail)

      if (isCurrentUser) {
        const freshUser = await AuthService.getCurrentUser()
        if (freshUser) setUser(freshUser)
      }
    } catch (err) {
      console.error('Error refreshing user detail:', err)
    }
  }

  const handleShowUnsolved = async () => {
    setShowUnsolvedModal(true)
    setLoadingUnsolved(true)
    try {
      const challengeEventParam = effectiveSelectedEventMode === 'any' ? 'all' : (effectiveSelectedEventMode === 'equals' ? effectiveSelectedEventId : null)
      const allChallenges = await getChallenges(userId || undefined, false, challengeEventParam)

      const nowMs = Date.now()
      const eventsById = new Map<string, Event>()
      for (const ev of startedEvents) {
        if (ev?.id) eventsById.set(ev.id, ev)
      }

      const isEventActive = (ev?: Event) => {
        if (!ev) return false
        if (ev.start_time) {
          const startMs = Date.parse(ev.start_time)
          if (!Number.isNaN(startMs) && startMs > nowMs) return false
        }
        if (ev.end_time) {
          const endMs = Date.parse(ev.end_time)
          if (!Number.isNaN(endMs) && endMs < nowMs) return false
        }
        return true
      }

      const solvedIds = new Set(solvedChallenges.map(c => c.id))

      const unsolved = allChallenges.filter((c: ChallengeWithSolve) => {
        if (solvedIds.has(c.id)) return false
        if (!c.is_active || c.is_maintenance) return false
        if (!c.event_id) return true
        const ev = eventsById.get(String(c.event_id))
        return isEventActive(ev)
      })
      setUnsolvedChallenges(unsolved)
    } catch (err) {
      console.error('Error fetching unsolved challenges:', err)
    } finally {
      setLoadingUnsolved(false)
    }
  }

  return {
    userDetail,
    setUserDetail,
    flagStats,
    loadingDetail,
    initialLoading,
    activeTab,
    setActiveTab,
    profileEvents,
    eventAccess,
    effectiveSelectedEvent,
    setSelectedEvent,
    showMainOption,
    solvedChallenges,
    firstBloodIds,
    categoryTotals,
    difficultyTotals,
    teamInfo,
    authInfo,
    showAllModal,
    setShowAllModal,
    showUnsolvedModal,
    setShowUnsolvedModal,
    unsolvedChallenges,
    loadingUnsolved,
    handleShowUnsolved,
    refreshUserDetail,
    router
  }
}
