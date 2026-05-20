'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import APP from '@/config'
import { TeamService } from '@/features/teams/services/team.service'
import { ChallengeService } from '@/shared/lib'
import type { ChallengeWithSolve } from '@/shared/types'

export function useChallengeList(userId?: string) {
  const [challenges, setChallenges] = useState<ChallengeWithSolve[]>([])
  const [isChallengesLoading, setIsChallengesLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const initialLoadingRef = useRef(true)

  useEffect(() => {
    initialLoadingRef.current = initialLoading
  }, [initialLoading])

  const loadChallenges = useCallback(async () => {
    if (!userId) return

    const shouldShowInitialLoader = initialLoadingRef.current
    if (shouldShowInitialLoader) setIsChallengesLoading(true)

    try {
      const [challengesData, teamChallengesResult] = await Promise.all([
        ChallengeService.getChallengesList(userId, false, 'all'),
        APP.teams.enabled ? TeamService.getMyTeamChallenges() : Promise.resolve({ challenges: [] }),
      ])
      const teamSolvedIds = new Set((teamChallengesResult?.challenges || []).map((challenge: any) => challenge.challenge_id))

      setChallenges((challengesData || []).map((challenge: any) => ({
        ...challenge,
        hint: [],
        attachments: [],
        description: typeof challenge.description === 'string' ? challenge.description : '',
        is_team_solved: teamSolvedIds.has(challenge.id),
      })))
    } finally {
      if (shouldShowInitialLoader) {
        initialLoadingRef.current = false
        setIsChallengesLoading(false)
        setInitialLoading(false)
      }
    }
  }, [userId])

  useEffect(() => {
    void loadChallenges()
  }, [loadChallenges])

  return {
    challenges,
    isChallengesLoading,
    initialLoading,
    loadChallenges,
  }
}
