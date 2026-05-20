'use client'

import { useCallback, useState } from 'react'
import { ChallengeService } from '@/shared/lib'
import type { User } from '@/shared/types'
import type { KeyedBooleanMap, KeyedFlagFeedbackMap, KeyedStringMap } from '../types'

type UseChallengeFlagSubmissionOptions = {
  user: User | null | undefined
  reloadChallenges: () => Promise<void>
}

export function useChallengeFlagSubmission({
  user,
  reloadChallenges,
}: UseChallengeFlagSubmissionOptions) {
  const [flagInputs, setFlagInputs] = useState<KeyedStringMap>({})
  const [flagFeedback, setFlagFeedback] = useState<KeyedFlagFeedbackMap>({})
  const [submitting, setSubmitting] = useState<KeyedBooleanMap>({})

  const handleFlagSubmit = useCallback(async (challengeId: string) => {
    if (!user || !flagInputs[challengeId]?.trim()) return

    setSubmitting((prev) => ({ ...prev, [challengeId]: true }))
    setFlagFeedback((prev) => ({ ...prev, [challengeId]: null }))

    try {
      const result = await ChallengeService.submitFlag(challengeId, flagInputs[challengeId].trim())
      if (result?.success) await reloadChallenges()
      setFlagFeedback((prev) => ({ ...prev, [challengeId]: { success: result.success, message: result.message ?? '' } }))

      if (result.success) {
        const audio = new Audio('/sounds/succes.wav')
        audio.volume = 0.3
        audio.play().catch(() => {})
        import('canvas-confetti').then((confetti) => {
          const duration = 0.8 * 1000
          const end = Date.now() + duration
          const frame = () => {
            confetti.default({
              particleCount: 3,
              startVelocity: 20,
              spread: 360,
              ticks: 80,
              gravity: 0.8,
              scalar: 0.8,
              colors: ['#00e0ff', '#ffffff', '#ff7b00'],
              origin: { x: Math.random(), y: Math.random() - 0.2 },
            })
            if (Date.now() < end) requestAnimationFrame(frame)
          }
          frame()
        })
        setFlagInputs((prev) => ({ ...prev, [challengeId]: '' }))
      } else {
        const audio = new Audio('/sounds/incorect.mp3')
        audio.volume = 0.3
        audio.play().catch(() => {})
      }
    } catch (error) {
      console.error('Error submitting flag:', error)
      setFlagFeedback((prev) => ({ ...prev, [challengeId]: { success: false, message: 'Failed to submit flag' } }))
    } finally {
      setSubmitting((prev) => ({ ...prev, [challengeId]: false }))
    }
  }, [flagInputs, reloadChallenges, user])

  const handleFlagInputChange = useCallback((challengeId: string, value: string) => {
    setFlagInputs((prev) => ({ ...prev, [challengeId]: value }))
  }, [])

  return {
    flagInputs,
    flagFeedback,
    submitting,
    handleFlagSubmit,
    handleFlagInputChange,
  }
}
