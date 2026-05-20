'use client'

import { useDeferredValue, useMemo } from 'react'
import APP from '@/config'
import type { ChallengeWithSolve } from '@/shared/types'
import {
  buildChallengeFilterOptions,
  filterChallengesByState,
  getDifficultyOrder,
  sortAndGroupChallenges,
} from '../lib'
import type {
  ChallengeEventFilterItem,
  ChallengeFilterSettings,
  ChallengeFilterState,
  ChallengeSortMode,
  EventSelectorValue,
} from '../types'

type UseFilteredChallengesOptions = {
  challenges: ChallengeWithSolve[]
  events: ChallengeEventFilterItem[]
  eventId: EventSelectorValue
  filters: ChallengeFilterState
  filterSettings: ChallengeFilterSettings
  sortMode: ChallengeSortMode
}

export function useFilteredChallenges({
  challenges,
  events,
  eventId,
  filters,
  filterSettings,
  sortMode,
}: UseFilteredChallengesOptions) {
  const deferredFilters = useDeferredValue(filters)
  const deferredFilterSettings = useDeferredValue(filterSettings)
  const difficultyOrder = useMemo(() => getDifficultyOrder((APP as any).difficultyStyles), [])
  const preferredOrder = useMemo(() => APP.challengeCategories || [], [])

  const filteredChallenges = useMemo(() => {
    return filterChallengesByState({
      challenges,
      events,
      eventId,
      filters: deferredFilters,
      settings: deferredFilterSettings,
    })
  }, [challenges, deferredFilterSettings, deferredFilters, eventId, events])

  const challengesForFilterOptions = useMemo(() => {
    return filterChallengesByState({
      challenges,
      events,
      eventId,
      filters: {
        status: 'all',
        category: 'all',
        difficulty: 'all',
        search: '',
        feature: 'N',
      },
      settings: deferredFilterSettings,
    })
  }, [challenges, deferredFilterSettings, eventId, events])

  const { categories, difficulties } = useMemo(() => {
    const options = buildChallengeFilterOptions(challengesForFilterOptions, preferredOrder)
    const selectedCategory = deferredFilters.category
    const selectedDifficulty = deferredFilters.difficulty

    return {
      categories:
        selectedCategory !== 'all' && !options.categories.includes(selectedCategory)
          ? [...options.categories, selectedCategory]
          : options.categories,
      difficulties:
        selectedDifficulty !== 'all' && !options.difficulties.includes(selectedDifficulty)
          ? [...options.difficulties, selectedDifficulty]
          : options.difficulties,
    }
  }, [
    challengesForFilterOptions,
    deferredFilters.category,
    deferredFilters.difficulty,
    preferredOrder,
  ])

  const { sortedFilteredChallenges, grouped, orderedKeys } = useMemo(() => {
    return sortAndGroupChallenges({
      challenges: filteredChallenges,
      sortMode,
      difficultyOrder,
      preferredCategoryOrder: preferredOrder,
    })
  }, [difficultyOrder, filteredChallenges, preferredOrder, sortMode])

  return {
    filteredChallenges,
    categories,
    difficulties,
    sortedFilteredChallenges,
    grouped,
    orderedKeys,
  }
}
