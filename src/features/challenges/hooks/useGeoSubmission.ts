'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { submitGeoLocation, getMyFlagSubmissionStats } from '@/shared/lib'
import type { User } from '@/shared/types'
import type { KeyedBooleanMap } from '../types'
import type { GeoCoordinates } from '../types'

type UseGeoSubmissionOptions = {
  user: User | null | undefined
  reloadChallenges: () => Promise<void>
  selectedChallengeId?: string | null
}

export function useGeoSubmission({
  user,
  reloadChallenges,
  selectedChallengeId,
}: UseGeoSubmissionOptions) {
  const [geoGuesses, setGeoGuesses] = useState<Record<string, GeoCoordinates | null>>({})
  const [geoFeedback, setGeoFeedback] = useState<Record<string, { success: boolean; message: string; distance_km?: number } | null>>({})
  const [submitting, setSubmitting] = useState<KeyedBooleanMap>({})

  const [stats, setStats] = useState<{
    incorrect_attempts: number
    window_attempts: number
    window_start_at: string
    remaining_attempts: number
    cooldown_seconds: number
  } | null>(null)

  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0)
  const feedbackTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(feedbackTimeoutsRef.current).forEach(clearTimeout)
    }
  }, [])

  const fetchStats = useCallback(async (challengeId: string) => {
    if (!user) return
    const data = await getMyFlagSubmissionStats(challengeId)
    setStats(data)
    if (data) {
      setCooldownSeconds(data.cooldown_seconds)
    } else {
      setCooldownSeconds(0)
    }
  }, [user])

  // Fetch stats when selected challenge changes
  useEffect(() => {
    if (selectedChallengeId) {
      fetchStats(selectedChallengeId)
    } else {
      setStats(null)
      setCooldownSeconds(0)
    }
  }, [selectedChallengeId, fetchStats])

  const submissionsRemaining = useMemo(() => {
    if (!stats) return 10
    return stats.remaining_attempts
  }, [stats])

  // Countdown timer for rate limiting
  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (selectedChallengeId) {
            fetchStats(selectedChallengeId)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownSeconds, selectedChallengeId, fetchStats])

  const handleGeoSubmit = useCallback(async (challengeId: string, coordinates: GeoCoordinates, prefix: string): Promise<boolean> => {
    if (!user || !coordinates) return false

    setSubmitting((prev) => ({ ...prev, [challengeId]: true }))
    setGeoFeedback((prev) => ({ ...prev, [challengeId]: null }))

    try {
      const result = await submitGeoLocation(challengeId, coordinates.lat, coordinates.lng, prefix)
      if (result?.success) await reloadChallenges()

      // Update our rate limiting stats immediately after submit
      await fetchStats(challengeId)

      // Clear any existing auto-dismiss timer for this challenge
      if (feedbackTimeoutsRef.current[challengeId]) {
        clearTimeout(feedbackTimeoutsRef.current[challengeId])
      }

      setGeoFeedback((prev) => ({
        ...prev,
        [challengeId]: {
          success: result.success,
          message: result.message,
          distance_km: result.distance_km
        }
      }))

      // Set new auto-dismiss timer (5 seconds)
      feedbackTimeoutsRef.current[challengeId] = setTimeout(() => {
        setGeoFeedback((prev) => ({ ...prev, [challengeId]: null }))
      }, 5000)

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
        return true
      } else {
        const audio = new Audio('/sounds/incorect.mp3')
        audio.volume = 0.3
        audio.play().catch(() => {})
        return false
      }
    } catch (error) {
      console.error('Error submitting geo location:', error)
      if (feedbackTimeoutsRef.current[challengeId]) {
        clearTimeout(feedbackTimeoutsRef.current[challengeId])
      }
      setGeoFeedback((prev) => ({
        ...prev,
        [challengeId]: { success: false, message: 'Failed to submit geo location' }
      }))
      feedbackTimeoutsRef.current[challengeId] = setTimeout(() => {
        setGeoFeedback((prev) => ({ ...prev, [challengeId]: null }))
      }, 5000)
      return false
    } finally {
      setSubmitting((prev) => ({ ...prev, [challengeId]: false }))
    }
  }, [reloadChallenges, user, fetchStats])

  const handleGeoGuessChange = useCallback((challengeId: string, value: GeoCoordinates | null) => {
    setGeoGuesses((prev) => ({ ...prev, [challengeId]: value }))
  }, [])

  return {
    geoGuesses,
    geoFeedback,
    submitting,
    submissionsRemaining,
    cooldownSeconds,
    fetchStats,
    handleGeoSubmit,
    handleGeoGuessChange,
  }
}
