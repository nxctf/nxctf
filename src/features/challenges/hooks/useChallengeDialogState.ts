'use client'

import { useCallback, useEffect, useState } from 'react'
import ky from 'ky'
import { ChallengeService } from '@/shared/lib'
import type { Attachment, ChallengeWithSolve } from '@/shared/types'
import {
  getStoredSelectedChallengeId,
  normalizeChallengeHints,
  persistSelectedChallenge,
} from '../lib'
import type {
  ChallengeDialogTab,
  HintModalState,
  KeyedBooleanMap,
  KeyedStringMap,
  Solver,
} from '../types'

type UseChallengeDialogStateOptions = {
  challenges: ChallengeWithSolve[]
  initialLoading: boolean
  ensureSubChallengesLoaded: (challengeId: string) => Promise<unknown> | unknown
  refreshSubChallenges: (challengeId: string) => Promise<unknown> | unknown
}

export function useChallengeDialogState({
  challenges,
  initialLoading,
  ensureSubChallengesLoaded,
  refreshSubChallenges,
}: UseChallengeDialogStateOptions) {
  const [challengeTab, setChallengeTab] = useState<ChallengeDialogTab>('challenge')
  const [solvers, setSolvers] = useState<Solver[]>([])
  const [placeholders, setPlaceholders] = useState<KeyedStringMap>({})
  const [showHintModal, setShowHintModal] = useState<HintModalState>({ challenge: null })
  const [downloading, setDownloading] = useState<KeyedBooleanMap>({})
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeWithSolve | null>(null)

  const [challengeDetailCache] = useState(() => new Map<string, ChallengeWithSolve>())
  const [solversCache] = useState(() => new Map<string, Solver[]>())

  const fetchSolversForChallenge = useCallback(async (challengeId: string) => {
    const cached = solversCache.get(challengeId)
    if (cached) {
      setSolvers(cached)
      return
    }

    try {
      const data = await ChallengeService.getSolversByChallenge(challengeId)
      solversCache.set(challengeId, data)
      setSolvers(data)
    } catch {
      setSolvers([])
    }
  }, [solversCache])

  const handleTabChange = useCallback(async (tab: ChallengeDialogTab, challengeId: string) => {
    setChallengeTab(tab)
    if (tab === 'solvers') {
      await fetchSolversForChallenge(challengeId)
      return
    }
    if (tab === 'question') await ensureSubChallengesLoaded(challengeId)
  }, [ensureSubChallengesLoaded, fetchSolversForChallenge])

  const openChallenge = useCallback(async (challenge: ChallengeWithSolve) => {
    persistSelectedChallenge(challenge.id)
    setChallengeTab('challenge')
    setSolvers([])
    void refreshSubChallenges(challenge.id)

    if (challenge.flag_placeholder && !placeholders[challenge.id]) {
      ChallengeService.getChallengePlaceholder(challenge.id).then((placeholder) => {
        if (placeholder) setPlaceholders((prev) => ({ ...prev, [challenge.id]: placeholder }))
      })
    }

    const cached = challengeDetailCache.get(challenge.id)
    setSelectedChallenge(
      cached
        ? { ...challenge, ...cached, hint: normalizeChallengeHints((cached as any).hint) } as any
        : {
          ...challenge,
          description: challenge.description || 'Loading...',
          hint: Array.isArray((challenge as any).hint) ? (challenge as any).hint : [],
          attachments: Array.isArray((challenge as any).attachments) ? (challenge as any).attachments : [],
        } as any
    )

    const freshDetail = await ChallengeService.getChallengeDetail(challenge.id)
    if (!freshDetail) return
    challengeDetailCache.set(challenge.id, freshDetail)
    setSelectedChallenge((prev) => {
      if (!prev || prev.id !== challenge.id) return prev
      return { ...prev, ...freshDetail, hint: normalizeChallengeHints((freshDetail as any).hint) } as any
    })
  }, [challengeDetailCache, placeholders, refreshSubChallenges])

  const closeChallenge = useCallback(() => {
    persistSelectedChallenge(null)
    setSelectedChallenge(null)
  }, [])

  useEffect(() => {
    if (initialLoading || challenges.length === 0 || selectedChallenge) return

    const storedChallengeId = getStoredSelectedChallengeId()
    if (!storedChallengeId) return

    const challengeToRestore = challenges.find((challenge) => challenge.id === storedChallengeId)
    if (challengeToRestore) void openChallenge(challengeToRestore)
    else persistSelectedChallenge(null)
  }, [challenges, initialLoading, openChallenge, selectedChallenge])

  const downloadFile = useCallback(async (attachment: Attachment, attachmentKey: string) => {
    setDownloading((prev) => ({ ...prev, [attachmentKey]: true }))

    try {
      if (attachment.type === 'file') {
        const blob = await ky.get(attachment.url).blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = attachment.name || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        window.open(attachment.url, '_blank')
      }
    } catch (error) {
      console.error('Download failed:', error)
      window.open(attachment.url, '_blank')
    } finally {
      setDownloading((prev) => ({ ...prev, [attachmentKey]: false }))
    }
  }, [])

  return {
    challengeTab,
    setChallengeTab,
    solvers,
    placeholders,
    showHintModal,
    setShowHintModal,
    downloading,
    selectedChallenge,
    handleTabChange,
    openChallenge,
    closeChallenge,
    downloadFile,
  }
}
