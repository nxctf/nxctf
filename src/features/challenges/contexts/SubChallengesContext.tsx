'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  SubChallengesService,
  type GetSubChallengesResult,
  type SubChallengeAnswerMap,
  type SubChallengeQuestion,
  type SubmitSubChallengesResult,
} from '@/features/challenges/services/sub-challenges.service'
import { useAuth } from '@/shared/contexts/AuthContext'

type SubChallengeState = {
  loaded: boolean
  loading: boolean
  submitting: boolean
  hasQuestions: boolean
  mode: 'none' | 'non_sequential' | 'sequential'
  completed: boolean
  questions: SubChallengeQuestion[]
  nextQuestion: SubChallengeQuestion | null
  results: Record<string, boolean>
  flag: string | null
  message: string | null
}

type SubChallengesContextType = {
  getState: (challengeId: string) => SubChallengeState
  getAnswers: (challengeId: string) => SubChallengeAnswerMap
  setAnswer: (challengeId: string, orderNumber: number, value: string) => void
  clearAnswers: (challengeId: string) => void
  ensureLoaded: (challengeId: string) => Promise<SubChallengeState>
  refresh: (challengeId: string) => Promise<SubChallengeState>
  submit: (challengeId: string, orderNumber?: number) => Promise<SubmitSubChallengesResult>
  resetAnswers: (challengeId: string) => void
}

const STORAGE_KEY_PREFIX = 'nxctf_sub_challenge_answers_v1:'

const DEFAULT_STATE: SubChallengeState = {
  loaded: false,
  loading: false,
  submitting: false,
  hasQuestions: false,
  mode: 'none',
  completed: false,
  questions: [],
  nextQuestion: null,
  results: {},
  flag: null,
  message: null,
}

const SubChallengesContext = createContext<SubChallengesContextType | undefined>(undefined)

const cloneDefaultState = (): SubChallengeState => ({
  ...DEFAULT_STATE,
  questions: [],
  results: {},
})

const safeParseAnswers = (raw: string | null): Record<string, SubChallengeAnswerMap> => {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, SubChallengeAnswerMap>
  } catch {
    return {}
  }
}

const normalizeQuestionResult = (
  current: SubChallengeState,
  response: GetSubChallengesResult,
  answers?: SubChallengeAnswerMap
): Pick<SubChallengeState, 'hasQuestions' | 'mode' | 'completed' | 'questions' | 'nextQuestion' | 'message' | 'results' | 'flag'> => {
  const mode = response.mode || 'none'
  const questions = Array.isArray(response.questions) ? response.questions : []
  const nextQuestion = response.question ?? null
  const completed = !!response.completed

  const hasQuestions =
    mode === 'sequential'
      ? !!nextQuestion || completed
      : mode === 'non_sequential'
        ? questions.length > 0
        : current.hasQuestions

  const results = { ...response.results }
  if (answers) {
    Object.keys(results).forEach((key) => {
      if (results[key] === false && !answers[key]?.trim()) {
        delete results[key]
      }
    })
  }

  return {
    hasQuestions,
    mode,
    completed,
    questions,
    nextQuestion,
    message: response.message || null,
    results,
    flag: response.flag || null,
  }
}

export function SubChallengesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [states, setStates] = useState<Record<string, SubChallengeState>>({})
  // answersByChallenge: Correct/verified answers only, synced to localStorage
  const [answersByChallenge, setAnswersByChallenge] = useState<Record<string, SubChallengeAnswerMap>>({})
  // tempAnswersByChallenge: Current user inputs, not necessarily correct or persisted
  const [tempAnswersByChallenge, setTempAnswersByChallenge] = useState<Record<string, SubChallengeAnswerMap>>({})

  const storageKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}${user?.id ? String(user.id) : 'anon'}`,
    [user?.id]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(storageKey)
    const parsed = safeParseAnswers(raw)
    setAnswersByChallenge(parsed)
    setTempAnswersByChallenge(parsed) // Initialize temp from persisted correct answers
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, JSON.stringify(answersByChallenge))
  }, [answersByChallenge, storageKey])

  const getState = (challengeId: string): SubChallengeState => {
    return states[challengeId] || cloneDefaultState()
  }

  const getAnswers = (challengeId: string): SubChallengeAnswerMap => {
    return tempAnswersByChallenge[challengeId] || {}
  }

  const setAnswer = (challengeId: string, orderNumber: number, value: string) => {
    const key = String(orderNumber)
    setTempAnswersByChallenge((prev) => ({
      ...prev,
      [challengeId]: {
        ...prev[challengeId],
        [key]: value,
      },
    }))
  }

  const clearAnswers = (challengeId: string) => {
    setAnswersByChallenge((prev) => {
      const next = { ...prev }
      delete next[challengeId]
      return next
    })
    setTempAnswersByChallenge((prev) => {
      const next = { ...prev }
      delete next[challengeId]
      return next
    })

    // Also reset results in the state
    setStates((prev) => {
      const current = prev[challengeId]
      if (!current) return prev
      return {
        ...prev,
        [challengeId]: {
          ...current,
          results: {},
          completed: false,
        },
      }
    })
  }

  const resetAnswers = (challengeId: string) => {
    clearAnswers(challengeId)
    refresh(challengeId, {}) // Explicitly pass empty answers to avoid stale state
  }

  const refresh = async (challengeId: string, pAnswers?: SubChallengeAnswerMap): Promise<SubChallengeState> => {
    setStates((prev) => {
      const current = prev[challengeId]
      return {
        ...prev,
        [challengeId]: {
          ...(current || cloneDefaultState()),
          loading: !current?.loaded, // Only show loader if not already loaded
        },
      }
    })

    const currentAnswers = pAnswers || getAnswers(challengeId)
    const response = await SubChallengesService.getSubChallenges(challengeId, currentAnswers)

    let computedState: SubChallengeState = cloneDefaultState()
    setStates((prev) => {
      const current = prev[challengeId] || cloneDefaultState()
      const normalized = normalizeQuestionResult(current, response, currentAnswers)
      computedState = {
        ...current,
        ...normalized,
        loaded: true,
        loading: false,
      }
      return {
        ...prev,
        [challengeId]: computedState,
      }
    })

    return computedState
  }

  const ensureLoaded = async (challengeId: string): Promise<SubChallengeState> => {
    const current = states[challengeId]
    if (current?.loaded) return current
    return refresh(challengeId)
  }

  const submit = async (challengeId: string): Promise<SubmitSubChallengesResult> => {
    setStates((prev) => ({
      ...prev,
      [challengeId]: {
        ...(prev[challengeId] || cloneDefaultState()),
        submitting: true,
      },
    }))

    // ALWAYS send all answers we have to ensure 'completed' and 'flag' logic works on server
    const payload = getAnswers(challengeId)
    const response = await SubChallengesService.submitSubChallenges(challengeId, payload)

    const normalizedResults = { ...response.results }
    Object.keys(normalizedResults).forEach((key) => {
      if (normalizedResults[key] === false && !payload[key]?.trim()) {
        delete normalizedResults[key]
      }
    })

    const correctAnswers: SubChallengeAnswerMap = {}
    Object.entries(normalizedResults).forEach(([key, ok]) => {
      if (ok) {
        const val = payload[key]
        if (val !== undefined) correctAnswers[key] = val
      }
    })

    const prevCorrect = answersByChallenge[challengeId] || {}
    const hasNewCorrect = Object.keys(correctAnswers).some((key) => prevCorrect[key] !== correctAnswers[key])
    const hasIncorrect = Object.values(normalizedResults).some((value) => value === false)

    if (hasNewCorrect) {
      const audio = new Audio('/sounds/tasks_succes.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } else if (hasIncorrect) {
      const audio = new Audio('/sounds/tasks_incorect.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    }

    setStates((prev) => {
      const current = prev[challengeId] || cloneDefaultState()
      const incomingResults = { ...normalizedResults }

      const newResults = {
        ...current.results,
        ...incomingResults,
      }

      // Identify correct answers from this submission
      // Persist ONLY correct answers to answersByChallenge (localStorage)
      if (Object.keys(correctAnswers).length > 0) {
        setAnswersByChallenge(prevAnswers => ({
          ...prevAnswers,
          [challengeId]: {
            ...prevAnswers[challengeId],
            ...correctAnswers
          }
        }))
      }

      return {
        ...prev,
        [challengeId]: {
          ...current,
          submitting: false,
          completed: !!response.completed,
          results: newResults,
          flag: response.flag || null,
          message: response.message || null,
        },
      }
    })

    // ALWAYS re-sync after submission to ensure 'questions' list and pointer are up to date
    await refresh(challengeId)

    return response
  }

  return (
    <SubChallengesContext.Provider
      value={{
        getState,
        getAnswers,
        setAnswer,
        clearAnswers,
        resetAnswers,
        ensureLoaded,
        refresh,
        submit,
      }}
    >
      {children}
    </SubChallengesContext.Provider>
  )
}

export function useSubChallenges() {
  const ctx = useContext(SubChallengesContext)
  if (!ctx) throw new Error('useSubChallenges must be used inside SubChallengesProvider')
  return ctx
}
