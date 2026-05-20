'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/contexts'
import { useEventContext } from '@/features/events/contexts/EventContext'
import { useFilterContext } from '@/features/challenges/contexts/FilterContext'
import { useSubChallenges } from '@/features/challenges/contexts/SubChallengesContext'
import type { ChallengesMainTab, EventSelectorValue } from '../types'
import { useChallengeDialogState } from './useChallengeDialogState'
import { useChallengeEventAccess } from './useChallengeEventAccess'
import { useChallengeFilterSettings } from './useChallengeFilterSettings'
import { useChallengeFlagSubmission } from './useChallengeFlagSubmission'
import { useChallengeList } from './useChallengeList'
import { useFilteredChallenges } from './useFilteredChallenges'

export function useChallengesPageData() {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<ChallengesMainTab>('challenges')
  const { filters, setFilters, layoutMode, sortMode, setSortMode } = useFilterContext()
  const { events, selectedEvent, setSelectedEvent } = useEventContext()
  const { user, loading } = useAuth()
  const {
    getState: getSubChallengeState,
    getAnswers: getSubChallengeAnswers,
    setAnswer: setSubChallengeAnswer,
    ensureLoaded: ensureSubChallengesLoaded,
    refresh: refreshSubChallenges,
    submit: submitSubChallengeAnswers,
    resetAnswers: resetSubChallengeAnswers,
  } = useSubChallenges()

  const eventId: EventSelectorValue = selectedEvent === 'main' ? null : selectedEvent
  const { challenges, isChallengesLoading, initialLoading, loadChallenges } = useChallengeList(user?.id)
  const { filterSettings, setFilterSettings } = useChallengeFilterSettings()
  const {
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
  } = useChallengeDialogState({
    challenges,
    initialLoading,
    ensureSubChallengesLoaded,
    refreshSubChallenges,
  })
  const {
    flagInputs,
    flagFeedback,
    submitting,
    handleFlagSubmit,
    handleFlagInputChange,
  } = useChallengeFlagSubmission({
    user,
    reloadChallenges: loadChallenges,
  })
  const {
    eventMembership,
    setEventMembership,
    eventMembershipLoading,
    targetEventId,
    setTargetEventId,
    targetEventMembership,
    setTargetEventMembership,
    isJoinDialogOpen,
    setIsJoinDialogOpen,
    allMembershipsLoaded,
    selectedEventObj,
    nowDate,
    selectedEventStart,
    selectedEventNotStarted,
    selectedEventEnded,
    attemptEventSelect,
    eventJoinBlocked,
    enrichedEvents,
    getCachedEventMembership,
    formatRemaining,
  } = useChallengeEventAccess({
    user,
    currentTab,
    setCurrentTab,
    events,
    eventId,
    setSelectedEvent,
  })
  const {
    filteredChallenges,
    categories,
    difficulties,
    sortedFilteredChallenges,
    grouped,
    orderedKeys,
  } = useFilteredChallenges({
    challenges,
    events,
    eventId,
    filters,
    filterSettings,
    sortMode,
  })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const handleSubChallengeAnswerChange = (challengeId: string, orderNumber: number, value: string) => {
    setSubChallengeAnswer(challengeId, orderNumber, value)
  }

  const handleSubChallengeSubmit = async (challengeId: string, orderNumber?: number) => {
    await submitSubChallengeAnswers(challengeId, orderNumber)
  }

  const selectedSubChallengeState = selectedChallenge ? getSubChallengeState(selectedChallenge.id) : null
  const selectedSubChallengeAnswers = selectedChallenge ? getSubChallengeAnswers(selectedChallenge.id) : {}

  return {
    user,
    loading,
    currentTab,
    setCurrentTab,
    challengeTab,
    setChallengeTab,
    solvers,
    flagInputs,
    flagFeedback,
    submitting,
    placeholders,
    showHintModal,
    setShowHintModal,
    downloading,
    selectedChallenge,
    filters,
    setFilters,
    layoutMode,
    sortMode,
    setSortMode,
    events,
    setSelectedEvent,
    eventId,
    filterSettings,
    setFilterSettings,
    eventMembership,
    setEventMembership,
    eventMembershipLoading,
    targetEventId,
    setTargetEventId,
    targetEventMembership,
    setTargetEventMembership,
    isJoinDialogOpen,
    setIsJoinDialogOpen,
    isChallengesLoading,
    initialLoading,
    allMembershipsLoaded,
    selectedEventObj,
    nowDate,
    selectedEventStart,
    selectedEventNotStarted,
    selectedEventEnded,
    handleTabChange,
    openChallenge,
    closeChallenge,
    handleFlagSubmit,
    handleFlagInputChange,
    handleSubChallengeAnswerChange,
    handleSubChallengeSubmit,
    attemptEventSelect,
    eventJoinBlocked,
    filteredChallenges,
    challenges,
    categories,
    difficulties,
    sortedFilteredChallenges,
    grouped,
    orderedKeys,
    downloadFile,
    enrichedEvents,
    selectedSubChallengeState,
    selectedSubChallengeAnswers,
    resetSubChallengeAnswers,
    getCachedEventMembership,
    formatRemaining,
  }
}
